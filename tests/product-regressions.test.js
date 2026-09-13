// Run with: node tests/product-regressions.test.js (no database connection).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const root = path.join(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));

function loadPage(name, search = '') {
    const html = fs.readFileSync(path.join(root, 'views', name + '.html'), 'utf8');
    const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
        .map(m => m[1]).find(source => source.includes('let currentFilters ='));
    const elements = new Map();
    const groups = { brand: [], discount: [] };
    const element = () => ({ value: '', hidden: true, children: [], entries: [], style: {},
        addEventListener() {}, setAttribute() {},
        appendChild(child) { this.children.push(child); },
        replaceChildren() { this.children = []; }
    });
    const document = {
        addEventListener() {}, createElement: element,
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, element());
            return elements.get(id);
        },
        querySelectorAll(selector) { return groups[selector.match(/name="(\w+)"/)[1]] || []; }
    };
    const location = { search, href: '' };
    const context = vm.createContext({ document, URLSearchParams, console,
        window: { location, addEventListener() {}, history: { replaceState(a, b, url) { location.href = url; } } },
        FormData: class {
            constructor(form) { this.params = new URLSearchParams(form.entries); }
            get(key) { return this.params.get(key); }
            getAll(key) { return this.params.getAll(key); }
        }
    });
    vm.runInContext(script, context);
    return { context, groups, document, location,
        run(source) { return vm.runInContext(source, context); },
        params() { return new URL(location.href, 'http://localhost').searchParams; },
        input(id, value) { document.getElementById(id).value = value; },
        form(entries) { document.getElementById('filterForm').entries = entries; }
    };
}

test('product URL keeps all selected brands/RAM/storage when paging', () => {
    const page = loadPage('products', '?brand=apple&brand=2&ram=8&ram=12GB&storage=256GB&storage=512GB&price_min=1000000&price_max=20000000&sort=price_desc&q=phone&page=2');
    page.run('parseURLParams(); goPage(3)');
    const params = page.params();
    assert.deepEqual(params.getAll('brand'), ['apple', '2']);
    assert.deepEqual(params.getAll('ram'), ['8GB', '12GB']);
    assert.deepEqual(params.getAll('storage'), ['256GB', '512GB']);
    assert.equal(params.get('sort'), 'price_desc');
    assert.equal(params.get('price_min'), '1000000');
    assert.equal(params.get('q'), 'phone');
    assert.equal(params.get('page'), '3');
});

test('checkbox change and submit retain price, search, sort and reset page', () => {
    const page = loadPage('products', '?page=5&featured=1');
    page.run('parseURLParams()');
    page.form([['category', 'dien-thoai'], ['brand', '1'], ['brand', '2'], ['ram', '8GB'], ['storage', '256GB'], ['q', 'Galaxy']]);
    page.input('priceMin', '5.000.000');
    page.input('priceMax', '30.000.000');
    page.input('sortSelect', 'price_asc');
    page.run('autoApplyFilter()');
    const params = page.params();
    assert.deepEqual(params.getAll('brand'), ['1', '2']);
    assert.equal(params.get('price_min'), '5000000');
    assert.equal(params.get('price_max'), '30000000');
    assert.equal(params.get('q'), 'Galaxy');
    assert.equal(params.get('sort'), 'price_asc');
    assert.equal(params.get('featured'), '1');
    assert.equal(params.get('page'), null);
});

test('removing tags does not restore old form values', () => {
    const page = loadPage('products', '?brand=1&brand=2&price_min=5000000&sort=discount');
    page.run('parseURLParams()');
    page.form([['brand', '1'], ['brand', '2']]);
    page.run("removeFilter('brand', '1'); removeFilter('price_min')");
    assert.deepEqual(page.params().getAll('brand'), ['2']);
    assert.equal(page.params().get('price_min'), null);
    assert.equal(page.params().get('sort'), 'discount');
});

test('invalid/reversed prices show an error instead of navigating', () => {
    for (const [min, max] of [['20000000', '1000000'], ['abc', ''], ['-1', ''], ['1,5', '']]) {
        const page = loadPage('products');
        page.input('priceMin', min);
        page.input('priceMax', max);
        page.run('applyFilters()');
        assert.equal(page.location.href, '');
        assert.equal(page.document.getElementById('filterError').hidden, false);
    }
});

test('RAM/brand checkboxes restore every URL choice, including slug links', () => {
    const page = loadPage('products', '?brand=apple&brand=2&ram=8&ram=12GB&storage=256GB&storage=512GB');
    page.run(`parseURLParams(); renderFilters({ categories: [],
        brands: [{id:1,name:'Apple',slug:'apple'},{id:2,name:'Samsung',slug:'samsung'}],
        rams:['8GB','12GB','16GB'], storages:['256GB','512GB'] })`);
    for (const [id, count] of [['brandFilters', 2], ['ramFilters', 2], ['storageFilters', 2]]) {
        assert.equal((page.document.getElementById(id).innerHTML.match(/ checked/g) || []).length, count);
    }
});

test('promotion filters combine multiple brands, price, discount and sort', () => {
    const page = loadPage('promotions', '?brand=apple&brand=2&discount=10&price_max=200&sort=price_desc');
    page.run(`allBrands = [{id:1,name:'Apple',slug:'apple'}, {id:2,name:'Samsung',slug:'samsung'}];
        allProducts = [
            {id:1,brand_id:1,price:100,discount_percent:15},
            {id:2,brand_id:2,price:200,discount_percent:20},
            {id:3,brand_id:3,price:100,discount_percent:30},
            {id:4,brand_id:1,price:300,discount_percent:15},
            {id:5,brand_id:1,price:100,discount_percent:5}];
        renderProducts = products => { globalThis.rendered = products.map(p => p.id); };
        parseURLParams(); applyFiltersAndRender(); buildUrlFromFilters();`);
    assert.deepEqual(plain(page.context.rendered), [2, 1]);
    assert.deepEqual(page.params().getAll('brand'), ['apple', '2']);
    page.run("removeFilter('brand', 'apple')");
    assert.deepEqual(plain(page.context.rendered), [2]);
});

test('removed promotion filters clear their checked form controls', () => {
    const page = loadPage('promotions', '?brand=1&discount=20');
    page.groups.brand.push({ value: '1', checked: true });
    page.groups.discount.push({ value: '0', checked: false }, { value: '20', checked: true });
    page.run("parseURLParams(); removeFilter('brand'); removeFilter('discount')");
    assert.equal(page.groups.brand[0].checked, false);
    assert.equal(page.groups.discount[0].checked, true);
    assert.equal(page.groups.discount[1].checked, false);
});

test('promotion loading includes results beyond the first 200 products', async () => {
    const page = loadPage('promotions');
    const calls = [];
    page.context.fetch = async url => {
        calls.push(url);
        const id = Number(new URL(url, 'http://localhost').searchParams.get('page'));
        return { ok: true, json: async () => ({ products: [{ id, discount_percent: 10 }], totalPages: 2 }) };
    };
    page.run('applyFiltersAndRender = () => {}');
    await page.run('loadPromotions()');
    assert.equal(calls.length, 2);
    assert.deepEqual(plain(page.run('allProducts.map(p => p.id)')), [1, 2]);
});

function adminDelete(query) {
    const filename = path.join(root, 'routes', 'admin.js');
    const localRequire = createRequire(filename);
    const context = vm.createContext({ module: { exports: {} }, __dirname: path.dirname(filename), console,
        require(name) { return name === '../config/database' ? { query } : localRequire(name); }
    });
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context);
    return context.module.exports.stack.find(layer => layer.route?.path === '/products/:id' && layer.route.methods.delete).route;
}

async function callDelete(route, id, role = 'admin') {
    const req = { params: { id }, session: { user_id: 1, role }, method: 'DELETE', headers: {}, get() {} };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    let authorized = false;
    route.stack[0].handle(req, res, () => { authorized = true; });
    if (authorized) await route.stack[1].handle(req, res);
    return res;
}

test('ordered product deletion preserves gallery and returns a clear conflict', async () => {
    const calls = [];
    const route = adminDelete(async sql => {
        calls.push(sql);
        const error = new Error('Referenced by order_items');
        error.code = 'ER_ROW_IS_REFERENCED_2';
        error.errno = 1451;
        throw error;
    });
    const res = await callDelete(route, '1');
    assert.equal(res.statusCode, 409);
    assert.match(res.body.error, /đơn hàng/);
    assert.deepEqual(calls, ['DELETE FROM products WHERE id = ?']);
});

test('unreferenced product deletion succeeds; missing products return 404', async () => {
    for (const [affectedRows, status] of [[1, 200], [0, 404]]) {
        const route = adminDelete(async () => [{ affectedRows }]);
        assert.equal((await callDelete(route, '1')).statusCode, status);
    }
});

test('invalid ID and non-admin requests cannot delete products', async () => {
    let calls = 0;
    const route = adminDelete(async () => { calls++; return [{ affectedRows: 1 }]; });
    assert.equal((await callDelete(route, '0')).statusCode, 400);
    assert.equal((await callDelete(route, 'abc')).statusCode, 400);
    assert.equal((await callDelete(route, '1', 'customer')).statusCode, 401);
    assert.equal(calls, 0);
});
