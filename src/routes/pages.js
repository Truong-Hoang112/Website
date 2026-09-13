const express = require('express');
const path = require('path');
const { viewsDir } = require('../core/paths');

const pages = {
    '/': 'index.html',
    '/products': 'products.html',
    '/promotions': 'promotions.html',
    '/product/:id': 'product-detail.html',
    '/cart': 'cart.html',
    '/checkout': 'checkout.html',
    '/login': 'login.html',
    '/register': 'register.html',
    '/forgot-password': 'forgot-password.html',
    '/profile': 'profile.html',
    '/orders': 'orders.html',
    '/order/:id': 'order-detail.html',
    '/wishlist': 'wishlist.html',
    '/compare': 'compare.html',
    '/policy': 'policy.html',
    '/contact': 'contact.html'
};

function createPageRouter(passport, googleOAuthEnabled) {
    const router = express.Router();
    if (googleOAuthEnabled) {
        router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
        router.get(
            '/auth/google/callback',
            passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
            (req, res) => res.redirect('/')
        );
    } else {
        router.get(['/auth/google', '/auth/google/callback'], (req, res) => {
            res.redirect('/login?error=google_auth_unavailable');
        });
    }
    for (const [route, filename] of Object.entries(pages)) {
        router.get(route, (req, res) => res.sendFile(path.join(viewsDir, filename)));
    }
    return router;
}

module.exports = createPageRouter;
