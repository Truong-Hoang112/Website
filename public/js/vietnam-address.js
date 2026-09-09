const VIETNAM_ADDRESS = {
    "Thành phố Hà Nội": {
        "Quận Ba Đình": ["Phường Phúc Xá", "Phường Trúc Bạch", "Phường Vĩnh Phúc", "Phường Cống Vị", "Phường Liễu Giai", "Phường Ngọc Hà", "Phường Điện Biên", "Phường Đội Cấn", "Phường Ngọc Khánh", "Phường Kim Mã", "Phường Giang Văn Minh", "Phường Thành Công", "Phường Phan Chu Trinh", "Phường Trung Hoà"],
        "Quận Hoàn Kiếm": ["Phường Hoàn Kiếm", "Phường Phan Chu Trinh", "Phường Lý Thái Tổ", "Phường Hàng Bạc", "Phường Hàng Gai", "Phường Cửa Đông", "Phường Lê Đại Hành", "Phường Trần Hưng Đạo", "Phường Hàng Trống", "Phường Quang Trung", "Phường Hàng Đào", "Phường Hàng Bông"],
        "Quận Tây Hồ": ["Phường Yên Phụ", "Phường Thụy Khuê", "Phường Quảng An", "Phường Xuân La", "Phường Tứ Liên", "Phường Nhật Tân", "Phường Phú Thượng", "Phường Bưởi", "Phường Thanh Niên"],
        "Quận Long Biên": ["Phường Phúc Đồng", "Phường Cự Khối", "Phường Giang Biên", "Phường Đức Giang", "Phường Việt Hưng", "Phường Gia Thụy", "Phường Ngọc Lâm", "Phường Phú Thượng", "Phường Bồ Đề", "Phường Sài Đồng"],
        "Quận Cầu Giấy": ["Phường Nghĩa Đô", "Phường Nghĩa Tân", "Phường Mai Dịch", "Phường Dịch Vọng", "Phường Dịch Vọng Hậu", "Phường Trung Hoà", "Phường Yên Hoà", "Phường Quan Hoa", "Phường Quang Tiến"],
        "Quận Đống Đa": ["Phường Cát Linh", "Phường Văn Miếu", "Phường Quốc Tử Giám", "Phường Láng Thượng", "Phường Láng Hạ", "Phường Khâm Thiên", "Phường Thổ Quan", "Phường Nam Đồng", "Phường Trung Phụng", "Phường Quang Trung", "Phường Trung Liệt", "Phường Phương Liên", "Phường Phương Canh", "Phường Tứ Liên", "Phường Thụy Khuê"],
        "Quận Hai Bà Trưng": ["Phường Nguyễn Du", "Phường Bạch Đằng", "Phường Phạm Đình Hổ", "Phường Bùi Thị Xuân", "Phường Ngô Thì Nhậm", "Phường Lê Đại Hành", "Phường Đồng Nhân", "Phường Đồng Xuân", "Phường Hàng Bạc", "Phường Hàng Buồm", "Phường Hàng Đào", "Phường Hàng Gai", "Phường Cửa Đông", "Phường Trần Hưng Đạo", "Phường Hàng Bông", "Phường Thanh Lương", "Phường Thanh Nhàn"],
        "Quận Hoàng Mai": ["Phường Trần Thánh Tông", "Phường Yên Sở", "Phường Hoàng Liệt", "Phường Hoàng Văn Thụ", "Phường Giếng Đáy", "Phường Thịnh Liệt", "Phường Đại Kim", "Phường Tân Mai", "Phường Định Công", "Phường Lĩnh Nam"],
        "Quận Thanh Xuân": ["Phường Thanh Xuân Trung", "Phường Thanh Xuân Bắc", "Phường Thanh Xuân Nam", "Phường Thanh Xuân Châu", "Phường Khương Trung", "Phường Khương Mai", "Phường Khương Đình", "Phường Phương Liệt", "Phường Hạ Đình", "Phường Thượng Đình", "Phường Nhân Chính", "Phường Thịnh Liệt"],
        "Huyện Từ Liêm": ["Thị Trấn Trạm Trôi", "Xã Thanh Xuân", "Xã Thụy Phương", "Xã Tân Lập", "Xã An Khánh", "Xã An Thư", "Xã Cổ Nhuế", "Xã Tây Tựu", "Xã Xuân Tảo", "Xã Liên Mạc", "Xã Đức Thượng", "Xã Minh Khai", "Xã Cầu Bì", "Xã Phú Diễn", "Xã Thượng Cổ", "Xã Phú Minh"],
        "Huyện Hoài Đức": ["Thị Trấn Trạm Trôi", "Xã Yên Sở", "Xã Sơn Đồng", "Xã Bắc Phong", "Xã Đức Thượng", "Xã Đức Thắng", "Xã Kim Nỗ", "Xã Văn Tiến", "Xã Ngọc Mỹ", "Xã Tiền Yên", "Xã La Phù", "Xã Đông La", "Xã Dương Liễu", "Xã Cát Quế", "Xã Thụy Phương", "Xã An Khánh", "Xã An Thư"],
        "Huyện Đông Anh": ["Thị trấn Đông Anh", "Xã Xuân Nộn", "Xã Tiên Dương", "Xã Vân Hà", "Xã Vân Nội", "Xã Liên Hà", "Xã Kim Nỗ", "Xã Uy Nỗ", "Xã Đại Mạch", "Xã Dục Tú", "Xã Cổ Loa", "Xã Hải Bối", "Xã Xuân Canh", "Xã Tầm Xá", "Xã Nguyên Khê", "Xã Nam Hồng", "Xã Bắc Hồng", "Xã Kim Hoa", "Xã Thụy Lâm"],
        "Huyện Gia Lâm": ["Thị trấn Yên Viên", "Xã Ninh Hiệp", "Xã Đình Xá", "Xã Phù Đổng", "Xã Trung Màu", "Xã Cần Kiệm", "Xã Lệ Chi", "Xã Dương Quang", "Xã Dương Xá", "Xã Bồ Đề", "Xã Phú Thị", "Xã Kim Sơn", "Xã Đặng Xá", "Xã Kiêu Kỵ", "Xã Đông Dư", "Xã Yên Thường", "Xã Yên Khương", "Xã Trung Giáo"],
        "Quận Bắc Từ Liêm": ["Phường Cổ Nhuế", "Phường Tây Tựu", "Phường Xuân Đỉnh", "Phường Thượng Cổ", "Phường Phú Diễn", "Phường Phúc Diễn", "Phường Thụy Phương", "Phường Minh Khai", "Phường Cầu Diễn", "Phường Xuân Tảo"],
        "Quận Nam Từ Liêm": ["Phường Mỹ Đình", "Phường Mễ Trì", "Phường Phú Đô", "Phường Đại Mỗ", "Phường Trung Văn", "Phường Tây Mỗ", "Phường Mỹ Đình", "Phường Cầu Diễn", "Phường Xuân Phương", "Phường Phương Canh"]
    },
    "Thành phố Hồ Chí Minh": {
        "Quận 1": ["Phường Tân Định", "Phường Đa Kao", "Phường Bến Nghé", "Phường Bến Thành", "Phường Nguyễn Thái Bình", "Phường Phạm Ngũ Lão", "Phường Cầu Ông Lãnh", "Phường Cô Giang", "Phường Nguyễn Cư Trinh", "Phường Cầu Khoa"],
        "Quận 3": ["Phường Võ Thị Sáu", "Phường Bến Thành", "Phường Phạm Ngũ Lão", "Phường Nguyễn Thái Bình", "Phường Đa Kao", "Phường Tân Định", "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5"],
        "Quận 4": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 8", "Phường 9", "Phường 10", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 18"],
        "Quận 5": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"],
        "Quận 6": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"],
        "Quận 7": ["Phường Tân Thuận Đông", "Phường Tân Thuận Tây", "Phường Tân Kiểng", "Phường Tân Hưng", "Phường Bình Thuận", "Phường Phú Thuận", "Phường Tân Phú", "Phường Tân Phong", "Phường Phú Mỹ"],
        "Quận 8": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16"],
        "Quận 10": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"],
        "Quận 11": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16"],
        "Quận 12": ["Phường Thạnh Xuân", "Phường Thạnh Lộc", "Phường Hiệp Thành", "Phường Trung Mỹ Tây", "Phường Tân Thới Hiệp", "Phường An Phú Đông", "Phường Tân Chánh Hiệp", "Phường Đông Hưng Thuận", "Phường Tân Hưng Thuận", "Phường Thới An"],
        "Quận Bình Thạnh": ["Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 6", "Phường 7", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 17", "Phường 19", "Phường 21", "Phường 22", "Phường 24", "Phường 25", "Phường 26", "Phường 27"],
        "Quận Tân Bình": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"],
        "Quận Tân Phú": ["Phường Tân Sơn Nhì", "Phường Tây Thạnh", "Phường Sơn Kỳ", "Phường Tân Quý", "Phường Tân Hưng", "Phường Bình Chiểu", "Phường Bình Hưng Hòa", "Phường Bình Trị Đông", "Phường Hiệp Tân", "Phường Hoà Thạnh"],
        "Quận Phú Nhuận": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 17"],
        "Quận Gò Vấp": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 17"],
        "Quận Thủ Đức": ["Phường Linh Xuân", "Phường Bình Chiểu", "Phường Tam Bình", "Phường Tam Phú", "Phường Hiệp Bình Phước", "Phường Hiệp Bình Chánh", "Phường Linh Chiểu", "Phường Linh Tây", "Phường Linh Đông", "Phường Trường Thọ", "Phường Bình Thọ"],
        "Huyện Bình Chánh": ["Thị trấn Bình Chánh", "Xã An Phú Tây", "Xã Hưng Long", "Xã Đại Phước", "Xã Tân Quý Tây", "Xã Bình Chánh", "Xã Vĩnh Lộc A", "Xã Vĩnh Lộc B", "Xã Bình Hưng", "Xã Bình Lợi", "Xã Lê Minh Xuân", "Xã Tân Nhựt", "Xã Tân Kiên"],
        "Huyện Củ Chi": ["Thị trấn Củ Chi", "Xã Phú Mỹ Hưng", "Xã An Phú", "Xã Trung Lập Hạ", "Xã Trung Lập Thượng", "Xã An Nhơn Tây", "Xã Nhuận Đức", "Xã Phạm Văn Cội", "Xã Phú Hòa Đông", "Xã Thái Mỹ", "Xã Tân Thạnh Tây", "Xã Tân Thạnh Đông"],
        "Huyện Hóc Môn": ["Thị trấn Hóc Môn", "Xã Tân Hiệp", "Xã Nhị Bình", "Xã Đông Thạnh", "Xã Tân Thới Nhì", "Xã Thới Tam Thôn", "Xã Xuân Thới Sơn", "Xã Xuân Thới Đông", "Xã Xuân Hới"],
        "Huyện Cần Giờ": ["Thị trấn Cần Giờ", "Xã An Thới Đông", "Xã Bình Khánh", "Xã Tam Thôn Hiệp", "Xã Lý Nhơn", "Xã Cần Thạnh"]
    },
    "Thành phố Đà Nẵng": {
        "Quận Hải Châu": ["Phường Thạch Thang", "Phường Hải Châu I", "Phường Hải Châu II", "Phường Phước Ninh", "Phường Hòa Thuận Tây", "Phường Hòa Thuận Đông", "Phường Nam Dương", "Phường Bình Hiên", "Phường Bình Thuận", "Phường Hòa Cường Bắc", "Phường Hòa Cường Nam", "Phường Khuê Trung"],
        "Quận Thanh Khê": ["Phường An Khê", "Phường Hòa Khê", "Phường Thanh Khê Tây", "Phường Thanh Khê Đông", "Phường Xuân Hà", "Phường Tân Chính", "Phường Chính Gián", "Phường Vĩnh Trung", "Phường Thạc Gián", "Phường An Đồn"],
        "Quận Liên Chiểu": ["Phường Hòa Hiệp Bắc", "Phường Hòa Hiệp Nam", "Phường Hòa Khánh Bắc", "Phường Hòa Khánh Nam", "Phường Hòa Minh"],
        "Quận Ngũ Hành Sơn": ["Phường Mỹ An", "Phường Hoà Hải", "Phường Hoà Quý", "Phường Khuê Mỹ"],
        "Quận Sơn Trà": ["Phường Thọ Quang", "Phường Nại Hiên Đông", "Phường Mân Thái", "Phường An Hải Bắc", "Phường An Hải Tây", "Phường An Hải Đông", "Phường Phước Mỹ"],
        "Huyện Hòa Vang": ["Xã Hòa Bắc", "Xã Hoà Liên", "Xã Hoà Ninh", "Xã Hoà Phú", "Xã Hoà Phước", "Xã Hoà Sơn", "Xã Hoà Tiến", "Xã Hoà Khương", "Xã Hoà Phong", "Xã Hoà Lộc"],
        "Huyện Hoàng Sa": []
    },
    "Thành phố Cần Thơ": {
        "Quận Ninh Kiều": ["Phường Cái Khế", "Phường An Nghiệp", "Phường An Cư", "Phường Tân An", "Phường Long Hoà", "Phường Bình Thuỷ", "Phường Trà Nóc", "Phường Phường 8", "Phường Phường 9", "Phường Phường 7", "Phường Phường 6", "Phường Phường 5", "Phường Phường 4", "Phường Phường 3", "Phường Phường 2", "Phường Phường 1"],
        "Quận Bình Thuỷ": ["Phường Bình Thuỷ", "Phường Trà Nóc", "Phường Phường 8", "Phường Phường 9", "Phường Phường 7", "Phường Phường 6", "Phường Phường 5", "Phường Long Hòa", "Phường Thới Bình", "Phường Thới Long", "Phường Thới Nhựt"],
        "Quận Cái Răng": ["Phường Lê Bình", "Phường Hưng Phú", "Phường Hưng Thạnh", "Phường Ba Láng", "Phường Thường Thạnh", "Phường Phú Thứ", "Phường Tân Phú"],
        "Quận Thốt Nốt": ["Phường Thốt Nốt", "Phường Thới Thuỷ", "Phường Thới Đông", "Phường Trung Nhứt", "Phường Nhơn Ái", "Phường Nhơn Thạnh", "Phường Tân Lộc", "Phường Trung Hưng", "Phường Thạnh Phú"],
        "Huyện Vĩnh Thạnh": ["Thị trấn Vĩnh Thạnh", "Xã Thạnh Mỹ", "Xã Thạnh Tiến", "Xã Thạnh Lợi", "Xã Thạnh Qưới", "Xã Thạnh Lộc", "Xã Thới Đông", "Xã Thới Hưng", "Xã Thới Khánh", "Xã Trung Hưng"],
        "Huyện Cờ Đỏ": ["Thị trấn Cờ Đỏ", "Xã Đông Hiệp", "Xã Đông Thắng", "Xã Thới Đông", "Xã Thới Hưng", "Xã Thới Khánh", "Xã Thới Phong", "Xã Thới Thạnh", "Xã Trung Hưng"],
        "Huyện Phong Điền": ["Thị trấn Phong Điền", "Xã Giai Xuân", "Xã Tân Thới", "Xã Phú Hưng", "Xã Mỹ Khánh", "Xã Nhơn Nghĩa", "Xã Gia Hội", "Xã Phú Hiệp"]
    },
    "Thành phố Hải Phòng": {
        "Quận Hồng Bàng": ["Phường Hùng Vương", "Phường Quán Toan", "Phường Nguyễn Bỉnh Khiêm", "Phường Hạ Lý", "Phường Minh Khai", "Phường Trại Chuối", "Phường Quang Trung", "Phường Phan Bội Châu", "Phường Hoàng Văn Thụ", "Phường Phan Đình Phùng"],
        "Quận Ngô Quyền": ["Phường Máy Chai", "Phường Máy Tơ", "Phường Vạn Mỹ", "Phường Cầu Tre", "Phường Lạc Viên", "Phường Cầu Đất", "Phường Gia Viên", "Phường Đông Khê", "Phường Cát Bi", "Phường Tràng Cát"],
        "Quận Lê Chân": ["Phường Hải Phòng", "Phường Hoàng Mai", "Phường Cát Dài", "Phường An Biên", "Phường Lam Sơn", "Phường An Dương", "Phường Hồ Nam", "Phường Trại Cau", "Phường Dư Hàng", "Phường Dư Hàng Kênh", "Phường Hàng Kênh"],
        "Quận Kiến An": ["Phường Phù Liễn", "Phường Bắc Sơn", "Phường Nam Sơn", "Phường Trần Thành Ngọ", "Phường Văn Đẩu", "Phường Đồng Hòa", "Phường Lãm Hà"],
        "Quận Đồ Sơn": ["Phường Vạn Sơn", "Phường Ngọc Xuyên", "Phường Bàng La", "Phường Hợp Đức", "Phường Minh Đức", "Phường Hải Sơn", "Phường Trân Châu"],
        "Huyện An Dương": ["Thị trấn An Dương", "Xã Lê Lợi", "Xã Đặng Cương", "Xã Đồng Thái", "Xã Hồng Phong", "Xã Tân Tiến", "Xã An Hưng", "Xã Quốc Tuấn", "Xã Nam Sơn", "Xã Lê Hồng"],
        "Huyện Thủy Nguyên": ["Thị trấn Thủy Nguyên", "Xã Kỳ Sơn", "Xã Liên Khê", "Xã Lưu Kiếm", "Xã Lưu Kỳ", "Xã Gia Minh", "Xã Minh Đức", "Xã Phục Lễ", "Xã Thuỷ Đường", "Xã Hoàng Đội"]
    },
    "Thành phố Biên Hòa": {
        "Phường Trung Dũng": ["Phường Trung Dũng"],
        "Phường Bảo Vinh": ["Phường Bảo Vinh"],
        "Phường Xuân Lạc": ["Phường Xuân Lạc"],
        "Phường Quyết Thắng": ["Phường Quyết Thắng"],
        "Phường Thanh Bình": ["Phường Thanh Bình"],
        "Phường Trảng Dài": ["Phường Trảng Dài"],
        "Phường Tân Biên": ["Phường Tân Biên"],
        "Phường Hố Nai": ["Phường Hố Nai"],
        "Phường Long Bình": ["Phường Long Bình"],
        "Phường Tam Hiệp": ["Phường Tam Hiệp"],
        "Phường Long Bình B": ["Phường Long Bình B"],
        "Xã Trung Hoà": ["Xã Trung Hoà"]
    },
    "Thành phố Huế": {
        "Phường Phú Hội": ["Phường Phú Hội"],
        "Phường Vĩnh Ninh": ["Phường Vĩnh Ninh"],
        "Phường Phường Đúc": ["Phường Phường Đúc"],
        "Phường Vĩnh Hà": ["Phường Vĩnh Hà"],
        "Phường Hương Sơ": ["Phường Hương Sơ"],
        "Phường Xuân Phú": ["Phường Xuân Phú"],
        "Phường Trường An": ["Phường Trường An"],
        "Phường Hương Long": ["Phường Hương Long"],
        "Phường An Đông": ["Phường An Đông"],
        "Phường An Tây": ["Phường An Tây"]
    },
    "Tỉnh Bắc Ninh": {
        "Thành phố Bắc Ninh": ["Phường Tiền An", "Phường Ninh Xá", "Phường Yên Giai", "Phường Võ Cường", "Phường Hòa Long", "Phường Vệ An", "Phường Đại Phúc", "Phường Suối Hoa", "Phường Khúc Xuyên"],
        "Thị xã Từ Sơn": ["Phường Đông Ngàn", "Phường Tân Hồng", "Phường Châu Khê", "Phường Hương Mạc", "Phường Phù Khê", "Phường Đồng Kỵ", "Phường Trang Hạ", "Phường Hồng Thái", "Phường Phạm Ngũ Lão"],
        "Huyện Yên Phong": ["Thị trấn Chờ", "Xã Yên Phụ", "Xã Yên Trung", "Xã Yên Mỹ", "Xã Yên Phong", "Xã Yên Tiến", "Xã Yên Khánh"],
        "Huyện Quế Võ": ["Thị trấn Quế Võ", "Xã Phương Sơn", "Xã Thụy Hòa", "Xã Hạ Long", "Xã Quế Lưu", "Xã Bồ Đề", "Xã Ngũ Hoà"],
        "Huyện Tiên Du": ["Thị trấn Tiên Du", "Xã Phật Tích", "Xã Hiên Vân", "Xã Liên Bão", "Xã Phú Lương", "Xã Cảnh Hưng"],
        "Huyện Thuận Thành": ["Thị trấn Thuận Thành", "Xã Đình Tổ", "Xã Ấp Tân", "Xã Hà Mãn", "Xã Trí Xuyên", "Xã Đại Đồng"]
    },
    "Tỉnh Vĩnh Phúc": {
        "Thành phố Vĩnh Yên": ["Phường Khâm Thiên", "Phường Đống Đa", "Phường Liễu Giai", "Phường Nguyễn Trãi", "Phường Tích Sơn", "Phường Hội Hợp", "Phường Đồng Tâm", "Phường Trưng Trắc"],
        "Thị xã Phúc Yên": ["Phường Phúc Yên", "Phường Hùng Vương", "Phường Trưng Nhị", "Phường Phan Bá Mạnh", "Phường Nam Viêm", "Phường Tiền Châu"],
        "Huyện Lập Thạch": ["Thị trấn Lập Thạch", "Xã Hợp Lý", "Xã Quang Sơn", "Xã Đồng Ích", "Xã Bắc Bình", "Xã Thanh Lâm"],
        "Huyện Tam Dương": ["Thị trấn Hợp Hòa", "Xã Đạo Tú", "Xã Thanh Vân", "Xã Hoàng Đức", "Xã Hương Canh"],
        "Huyện Tam Đảo": ["Thị trấn Tam Đảo", "Xã Hướng Đạo", "Xã Đạo Trù", "Xã Yên Dương", "Xã Bồ Lý"],
        "Huyện Vĩnh Tường": ["Thị trấn Vĩnh Tường", "Xã Vũ Di", "Xã Lý Nhân", "Xã Tân Phú", "Xã Kim Xá"],
        "Huyện Yên Lạc": ["Thị trấn Yên Lạc", "Xã Đồng Cổn", "Xã Liễn Đậu", "Xã Nguyệt Đức", "Xã Tề Lỗ"]
    },
    "Tỉnh Bắc Giang": {
        "Thành phố Bắc Giang": ["Phường Trần Nguyên Hãn", "Phường Ngô Quyền", "Phường Mỹ Độ", "Phường Xương Giang", "Phường Đa Mai", "Phường Dĩnh Kế", "Phường Thọ Xương", "Phường Trưng Vương"],
        "Huyện Yên Thế": ["Thị trấn Nếnh", "Xã Tiền Phong", "Xã Hương Vĩ", "Xã Đồng Vương", "Xã An Thượng"],
        "Huyện Tân Yên": ["Thị trấn Cao Thượng", "Xã Hợp Đức", "Xã Lam Cốt", "Xã Lan Giới", "Xã Ngọc Châu"],
        "Huyện Lạng Giang": ["Thị trấn Vôi", "Xã Thái Đường", "Xã Hương Sơn", "Xã Đào Mỹ", "Xã Mỹ Hà"]
    },
    "Tỉnh Quảng Ninh": {
        "Thành phố Hạ Long": ["Phường Hồng Hải", "Phường Hồng Gai", "Phường Bạch Đằng", "Phường Hồng Gió", "Phường Yết Kiêu", "Phường Hà Phong", "Phường Hà Khẩu", "Phường Cao Thắng", "Phường Hà Lầm", "Phường Giếng Đáy"],
        "Thành phố Cẩm Phả": ["Phường Cẩm Phả", "Phường Cẩm Tây", "Phường Cẩm Đông", "Phường Cẩm Bình", "Phường Quảng Yên", "Phường Cẩm Thủy"],
        "Thành phố Uông Bí": ["Phường Uông Bí", "Phường Vàng Danh", "Phường Thanh Sơn", "Phường Bắc Sơn", "Phường Nam Khê"],
        "Thị xã Quảng Yên": ["Phường Quảng Yên", "Phường Đông Mai", "Phường Minh Thành", "Phường Tiền An", "Phường Nam Hòa"],
        "Huyện Hải Hà": ["Thị trấn Quảng Hà", "Xã Cái Chi", "Xã Đại Bình", "Xã Tiên Yên"],
        "Huyện Đầm Hà": ["Thị trấn Đầm Hà", "Xã Tân Bình", "Xã Đại Dương", "Xã Quảng Lâm"],
        "Huyện Bình Liêu": ["Thị trấn Bình Liêu", "Xã Hoành Mô", "Xã Đồng Văn", "Xã Vô Ngại"],
        "Huyện Tiên Yên": ["Thị trấn Tiên Yên", "Xã Đại Thành", "Xã Hà Lợi", "Xã Tiên Lãng"]
    },
    "Tỉnh Hải Dương": {
        "Thành phố Hải Dương": ["Phường Ngọc Châu", "Phường Phạm Ngũ Lão", "Phường Quang Trung", "Phường Trần Hưng Đạo", "Phường Thanh Bình", "Phường Tân Bình", "Phường Bình Hàn", "Phường Lê Thanh Nghị"],
        "Thị xã Chí Linh": ["Phường Chí Linh", "Phường Văn An", "Phường Đông Ka", "Phường Hoàng Tân", "Phường Bạch Đằng"],
        "Huyện Kim Thành": ["Thị trấn Kim Lương", "Thị trấn Phú Thái", "Xã Liên Hòa", "Xã Đồng Gia"],
        "Huyện Nam Sách": ["Thị trấn Nam Sách", "Xã An Bình", "Xã Định Hưng", "Xã Hiệp Cát"],
        "Huyện Thanh Miện": ["Thị trấn Thanh Miện", "Xã Cao Thắng", "Xã Lam Sơn", "Xã Hồng Quang"],
        "Huyện Ninh Giang": ["Thị trấn Ninh Giang", "Xã Ứng Hoè", "Xã Văn Hội", "Xã Tân Phong"]
    },
    "Tỉnh Hưng Yên": {
        "Thành phố Hưng Yên": ["Phường Lam Sơn", "Phường Hồng Châu", "Phường Quang Trung", "Phường Trần Hưng Đạo", "Phường Bần Yên Nhân", "Phường Minh Tân"],
        "Thị xã Mỹ Hào": ["Phường Mỹ Hào", "Phường Bần Yên Nhân", "Phường Cẩm Xá", "Phường Dị Sử", "Phường Phan Thanh"],
        "Huyện Văn Lâm": ["Thị trấn Như Quỳnh", "Xã Văn Lâm", "Xã Trương Quỳnh", "Xã Lương Tài"],
        "Huyện Văn Giang": ["Thị trấn Văn Giang", "Xã Xuân Quan", "Xã Cửu Cao", "Xã Phụng Công"],
        "Huyện Yên Mỹ": ["Thị trấn Yên Mỹ", "Xã Yên Phú", "Xã Thanh Long", "Xã Yên Hòa"]
    },
    "Tỉnh Thái Bình": {
        "Thành phố Thái Bình": ["Phường Bồ Đề", "Phường Đề Ker", "Phường Hoàng Diệu", "Phường Lê Hồng Phong", "Phường Phú Khánh", "Phường Quang Trung", "Phường Trần Hưng Đạo", "Phường Trần Lê"],
        "Thị xã Quỳnh Phụ": ["Phường An Ninh", "Phường Quỳnh Côi", "Phường Quỳnh Hải", "Phường An Bài"],
        "Huyện Đông Hưng": ["Thị trấn Đông Hưng", "Xã Hồng Việt", "Xã Hồng Phong", "Xã Đông Sơn"],
        "Huyện Hưng Hà": ["Thị trấn Hưng Hà", "Xã Cao Bắc", "Xã Điền Xá", "Xã Thái Hưng"],
        "Huyện Kiến Xương": ["Thị trấn Kiến Xương", "Xã Bình Nguyên", "Xã Lại Xuân", "Xã Quốc Tuấn"]
    },
    "Tỉnh Nam Định": {
        "Thành phố Nam Định": ["Phường Cửa Bắc", "Phường Cửa Nam", "Phường Vị Hoàng", "Phường Vị Xuyên", "Phường Trần Tế Xương", "Phường Phúc Hà", "Phường Ngô Quyền", "Phường Năng Tĩnh"],
        "Thị xã Cờ Lờ": ["Phường Cờ Lờ", "Phường Hải Hưng", "Phường Hải Triều", "Phường Đông Vuông"],
        "Huyện Ý Yên": ["Thị trấn Ý Yên", "Xã Yên Tiến", "Xã Yên Khánh", "Xã Yên Phong", "Xã Yên Nhân"],
        "Huyện Nam Trực": ["Thị trấn Nam Trực", "Xã Nam Hùng", "Xã Hoàng Nam", "Xã Nghĩa An"],
        "Huyện Trực Ninh": ["Thị trấn Cát Đằng", "Xã Trực Ninh", "Xã Trung Đông", "Xã Liễu Trì"]
    },
    "Tỉnh Ninh Bình": {
        "Thành phố Ninh Bình": ["Phường Đông Thành", "Phường Ninh Khánh", "Phường Nam Bình", "Phường Phong Thịnh", "Phường Nam Thanh", "Phường Trung Sơn"],
        "Thành phố Tam Điệp": ["Phường Tam Điệp", "Phường Tân Thành", "Phường Yên Bình", "Phường Yên Sơn"],
        "Huyện Hoa Lư": ["Thị trấn Hoa Lư", "Xã Ninh Hòa", "Xã Ninh Khang", "Xã Ninh Mỹ", "Xã Ninh Thắng"],
        "Huyện Yên Khánh": ["Thị trấn Yên Khánh", "Xã Khánh Nhạc", "Xã Khánh An", "Xã Khánh Cường"],
        "Huyện Kim Sơn": ["Thị trấn Bình Minh", "Xã Kim Tân", "Xã Kim Trung", "Xã Đồng Phong"]
    },
    "Tỉnh Thanh Hóa": {
        "Thành phố Thanh Hóa": ["Phường Đông Thọ", "Phường Nam Ngạn", "Phường Trường Sơn", "Phường Ba Đình", "Phường Điện Biên", "Phường Hàm Rồng", "Phường Lam Sơn", "Phường Quảng Hưng"],
        "Thị xã Bỉm Sơn": ["Phường Bỉm Sơn", "Phường Trung Sơn", "Phường Đông Sơn", "Phường Quang Trung"],
        "Thị xã Sầm Sơn": ["Phường Sầm Sơn", "Phường Trung Sơn", "Phường Bắc Sơn", "Phường Quảng Cư"],
        "Huyện Hậu Lộc": ["Thị trấn Hậu Lộc", "Xã Hưng Lộc", "Xã Đại Lộc", "Xã Thịnh Lộc", "Xã Tiến Lộc"],
        "Huyện Triệu Sơn": ["Thị trấn Triệu Sơn", "Xã Thọ Sơn", "Xã Thọ Tiến", "Xã Hợp Lý", "Xã Minh Sơn"]
    },
    "Tỉnh Nghệ An": {
        "Thành phố Vinh": ["Phường Lê Lợi", "Phường Quán Bàu", "Phường Trung Đô", "Phường Hưng Phúc", "Phường Hưng Dũng", "Phường Hưng Bình", "Phường Hưng Thành", "Phường Đội Cung", "Phường Lê Mao", "Phường Trường Thi"],
        "Thị xã Cửa Lò": ["Phường Nghi Thuỷ", "Phường Thuỷ Hương", "Phường Thuỷ Dương", "Phường Thuỷ Lộc", "Phường Thuỷ Phương"],
        "Thị xã Thái Hoà": ["Phường Hoà Hiếu", "Phường Quang Tiến", "Phường Long Sơn", "Phường Nghĩa Hưng"],
        "Huyện Diễn Châu": ["Thị trấn Diễn Châu", "Xã Diễn Lâm", "Xã Diễn Vạn", "Xã Diễn Kim", "Xã Diễn Đoài"],
        "Huyện Yên Thành": ["Thị trấn Yên Thành", "Xã Thịnh Yên", "Xã Bắc Thành", "Xã Trung Thành", "Xã Nam Thành"],
        "Huyện Quỳnh Lưu": ["Thị trấn Cầu Giát", "Xã Quỳnh Thuỷ", "Xã Quỳnh Hưng", "Xã Quỳnh Tân", "Xã Quỳnh Diễn"]
    },
    "Tỉnh Hà Tĩnh": {
        "Thành phố Hà Tĩnh": ["Phường Trần Phú", "Phường Nam Hà", "Phường Bắc Hà", "Phường Nguyễn Du", "Phường Thạch Trung", "Phường Thạch Quý", "Phường Văn Yên", "Phường Hưng Trí"],
        "Thị xã Hồng Lĩnh": ["Phường Hưng Đạo", "Phường Đậu Liêu", "Phường Bắc Lĩnh", "Phường Nam Lĩnh"],
        "Huyện Thạch Hà": ["Thị trấn Thạch Hà", "Xã Thạch Liên", "Xã Thạch Sơn", "Xã Thạch Đỉnh", "Xã Thạch Thanh"],
        "Huyện Cẩm Xuyên": ["Thị trấn Cẩm Xuyên", "Xã Cẩm Trung", "Xã Cẩm Thành", "Xã Cẩm Quan", "Xã Cẩm Hà"]
    },
    "Tỉnh Quảng Bình": {
        "Thành phố Đồng Hới": ["Phường Hải Thành", "Phường Đồng Phú", "Phường Bắc Lý", "Phường Nam Lý", "Phường Đức Ninh", "Phường Hồng Hải", "Phường Bảo Ninh"],
        "Thị xã Ba Đồn": ["Phường Ba Đồn", "Phường Quảng Phong", "Phường Quảng Thuỷ", "Phường Quảng Cát", "Phường Quảng Phúc"],
        "Huyện Bố Trạch": ["Thị trấn Hoàn Lão", "Xã Bố Trạch", "Xã Phú Đức", "Xã Phú Mỹ", "Xã Sơn Lộc"],
        "Huyện Quảng Ninh": ["Thị trấn Quảng Ninh", "Xã Hải Ninh", "Xã Vĩnh Ninh", "Xã Quảng Hải", "Xã Lương Ninh"]
    },
    "Tỉnh Quảng Trị": {
        "Thành phố Đông Hà": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường Đông Lương", "Phường Đông Giang"],
        "Thị xã Quảng Trị": ["Phường Quảng Trị", "Phường An Đôn", "Phường 1", "Phường 2", "Phường 3"],
        "Huyện Hướng Hóa": ["Thị trấn Khe Sanh", "Xã Hướng Lợi", "Xã Hướng Phùng", "Xã Hướng Sơn", "Xã Hướng Việt"],
        "Huyện Gio Linh": ["Thị trấn Gio Linh", "Xã Trung Giang", "Xã Trung Hải", "Xã Gio Quang", "Xã Linh Trường"]
    },
    "Tỉnh Thừa Thiên Huế": {
        "Thành phố Huế": ["Phường Phú Hội", "Phường Vĩnh Ninh", "Phường Phường Đúc", "Phường Vĩnh Hà", "Phường Hương Sơ", "Phường Xuân Phú", "Phường Trường An", "Phường Hương Long", "Phường An Đông", "Phường An Tây"],
        "Thị xã Hương Thủy": ["Phường Phú Bài", "Phường Thủy Dương", "Phường Thủy Tân", "Phường Thủy Phương", "Phường Thủy Chương"],
        "Huyện Phong Điền": ["Thị trấn Phong Điền", "Xã Điền Hương", "Xã Điền Môn", "Xã Phong Thu", "Xã Phong Hải"],
        "Huyện Quảng Điền": ["Thị trấn UBND huyện Quảng Điền", "Xã Quảng Ngạn", "Xã Quảng Lợi", "Xã Quảng Công", "Xã Quảng Thọ"]
    },
    "Tỉnh Quảng Nam": {
        "Thành phố Tam Kỳ": ["Phường An Mỹ", "Phường An Xuân", "Phường An Phú", "Phường Trường Xuân", "Phường Tân Thạnh", "Phường Phước Gia"],
        "Thành phố Hội An": ["Phường Cẩm Châu", "Phường Cẩm Nam", "Phường Cẩm An", "Phường Sơn Phong", "Phường Tân An"],
        "Huyện Điện Bàn": ["Thị trấn Điện Bàn", "Xã Điện Tiến", "Xã Điện Hồng", "Xã Điện Thắng", "Xã Điện Thọ"],
        "Huyện Duy Xuyên": ["Thị trấn Duy Xuyên", "Xã Duy Trinh", "Xã Duy Tân", "Xã Duy Hưng", "Xã Duy Thu"],
        "Huyện Nam Trà My": ["Thị trấn Nam Trà My", "Xã Trà Mai", "Xã Trà Cằn", "Xã Trà Vạn", "Xã Trà Dương"]
    },
    "Tỉnh Quảng Ngãi": {
        "Thành phố Quảng Ngãi": ["Phường Lê Lợi", "Phường Trần Phú", "Phường Nguyễn Nghiêm", "Phường Thanh Hà", "Phường Chánh Lộ", "Phường Nghĩa Lộ"],
        "Thị xã Đức Phổ": ["Phường Đức Phổ", "Phường Phổ Ninh", "Phường Phổ Thạnh", "Phường Phổ Châu"],
        "Huyện Sơn Tịnh": ["Thị trấn Sơn Tịnh", "Xã Tịnh Hà", "Xã Tịnh Khê", "Xã Tịnh Thọ", "Xã Tịnh Sơn"],
        "Huyện Tư Nghĩa": ["Thị trấn La Hà", "Xã Nghĩa Điền", "Xã Nghĩa Thương", "Xã Nghĩa Trung", "Xã Nghĩa Hiệp"]
    },
    "Tỉnh Bình Định": {
        "Thành phố Quy Nhơn": ["Phường Trần Phú", "Phường Hải Cảng", "Phường Lê Lợi", "Phường Thị Nại", "Phường Bùi Thị Xuân", "Phường Nguyễn Trãi", "Phường Đống Đa", "Phường Trần Hưng Đạo"],
        "Thị xã An Nhơn": ["Phường An Nhơn", "Phường Đập Đá", "Phường Bình Định", "Phường Trung Lương"],
        "Huyện Tây Sơn": ["Thị trấn Phú Phong", "Xã Bình Tân", "Xã Bình Hòa", "Xã Bình Thành", "Xã Tây Thuận"],
        "Huyện Phù Cát": ["Thị trấn Phù Cát", "Xã Cát Tài", "Xã Cát Hưng", "Xã Cát Trinh", "Xã Cát Hanh"]
    },
    "Tỉnh Phú Yên": {
        "Thành phố Tuy Hòa": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường Phú Đông", "Phường Phú Lâm"],
        "Thị xã Sông Cầu": ["Phường Sông Cầu", "Phường Xuân Đài", "Phường Đông Hải", "Phường Hải Bình"],
        "Huyện Đông Hòa": ["Thị trấn Hòa Hiệp Trung", "Xã Hòa Tân Tây", "Xã Hòa Phong", "Xã Hòa Phú", "Xã Hòa Mỹ Đông"],
        "Huyện Sơn Hòa": ["Thị trấn Củng Sơn", "Xã Sơn Hà", "Xã Sơn Thành", "Xã Sơn Trung", "Xã Sơn Nguyên"]
    },
    "Tỉnh Khánh Hòa": {
        "Thành phố Nha Trang": ["Phường Vĩnh Hòa", "Phường Vĩnh Hải", "Phường Vĩnh Nguyên", "Phường Vĩnh Phước", "Phường Vĩnh Thọ", "Phường Vĩnh Trung", "Phường Xương Huân", "Phường Phước Hải", "Phường Phước Tân", "Phường Lộc Thọ", "Phường Ngọc Hiệp"],
        "Thành phố Cam Ranh": ["Phường Cam Phúc Bắc", "Phường Cam Phúc Nam", "Phường Cam Lợi", "Phường Cam Nghĩa", "Phường Ba Ngòi", "Phường Cam Thuận"],
        "Thị xã Ninh Hòa": ["Phường Ninh Hòa", "Phường Ninh Sơn", "Phường Ninh Thủy", "Phường Ninh Đa", "Phường Ninh Bình"],
        "Huyện Diên Khánh": ["Thị trấn Diên Khánh", "Xã Diên Lâm", "Xã Diên Điền", "Xã Diên Phước", "Xã Diên Sơn"],
        "Huyện Khánh Vĩnh": ["Thị trấn Khánh Vĩnh", "Xã Khánh Hiệp", "Xã Khánh Thành", "Xã Khánh Nam", "Xã Sông Cầu"]
    },
    "Tỉnh Bình Thuận": {
        "Thành phố Phan Thiết": ["Phường Mũi Né", "Phường Hàm Tiến", "Phường Phú Hài", "Phường Phước Hội", "Phường Xuân An", "Phường Thanh Hải", "Phường Hưng Long", "Phường Đức Nghĩa"],
        "Thị xã La Gi": ["Phường La Gi", "Phường Tân Thiện", "Phường Tân Xuân", "Phường Bình Tân"],
        "Huyện Hàm Thuận Bắc": ["Thị trấn Thuận Nam", "Xã Mỹ Hạnh", "Xã Mỹ Phong", "Xã Hàm Mỹ", "Xã Hàm Cần"],
        "Huyện Hàm Thuận Nam": ["Thị trấn Tân Minh", "Xã Thắng Hải", "Xã Tân Hà", "Xã Hàm Liêm", "Xã Hàm Chính"],
        "Huyện Tuy Phong": ["Thị trấn Liên Hương", "Xã Phan Rí Cửa", "Xã Phong Nẫm", "Xã Hải Ninh", "Xã Bình Thạnh"]
    },
    "Tỉnh Lâm Đồng": {
        "Thành phố Đà Lạt": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường Đa Mặn", "Phường Đa Thành", "Phường Măng Lin", "Phường Tân Lập"],
        "Thành phố Bảo Lộc": ["Phường Bảo Lộc", "Phường Lộc Phát", "Phường Lộc Tiến", "Phường Lộc Sơn", "Phường B'lao", "Phường Lộc Châu"],
        "Huyện Đơn Dương": ["Thị trấn Thạnh Mỹ", "Xã Đa Quý", "Xã Ka Đô", "Xã Quảng Lợi", "Xã Đơn Dương"],
        "Huyện Lạc Dương": ["Thị trấn Lạc Dương", "Xã Đạ Nhim", "Xã Đạ Chais", "Xã Lát", "Xã Cébé"],
        "Huyện Di Linh": ["Thị trấn Di Linh", "Xã Đinh Trang Thượng", "Xã Gia Bắc", "Xã Sơn Điền", "Xã Bảo Thuận"]
    },
    "Tỉnh Bình Phước": {
        "Thành phố Đồng Xoài": ["Phường Tân Bình", "Phường Tân Phú", "Phường Tân Đồng", "Phường Tiến Thành", "Phường Tiến Hưng"],
        "Thị xã Bình Long": ["Phường Bình Long", "Phường An Lộc", "Phường Phú Điền", "Phường Thanh Lương"],
        "Huyện Đồng Phú": ["Thị trấn Đồng Phú", "Xã Tân Lập", "Xã Tân Hưng", "Xã Tân Tiến", "Xã Bình Minh"],
        "Huyện Bù Gia Mập": ["Thị trấn Bù Gia Mập", "Xã Phú Nghĩa", "Xã Phú Văn", "Xã Bình Thắng", "Xã Đắk Ơ"]
    },
    "Tỉnh Tây Ninh": {
        "Thành phố Tây Ninh": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường Ninh Sơn", "Phường Ninh Thạnh", "Phường Bình Minh", "Phường Thạnh Tân"],
        "Thị xã Trảng Bàng": ["Phường Trảng Bàng", "Phường Phước Bình", "Phường Lộc Hưng", "Phường Gia Bình", "Phường Đôn Xuân"],
        "Huyện Gò Dầu": ["Thị trấn Gò Dầu", "Xã Thanh Phước", "Xã Bàu Đồn", "Xã Gia Lộc", "Xã Hiệp Thạnh"],
        "Huyện Bến Cầu": ["Thị trấn Bến Cầu", "Xã Long Thành", "Xã Tiên Thuận", "Xã Bình Thạnh", "Xã Lợi Bình"]
    },
    "Tỉnh Bình Dương": {
        "Thành phố Thủ Dầu Một": ["Phường Phú Hòa", "Phường Phú Cường", "Phường Phú Mỹ", "Phường Chánh Mỹ", "Phường Chánh Nghĩa", "Phường Hiệp Thành", "Phường Phú Thọ", "Phường Phú Lợi"],
        "Thị xã Bến Cát": ["Phường Bến Cát", "Phường Mỹ Phước", "Phường Thới Hòa", "Phường Hòa Lợi", "Phường Tân Định"],
        "Thị xã Tân Uyên": ["Phường Tân Uyên", "Phường Uyên Hưng", "Phường Tân Phước Khánh", "Phường Vĩnh Tân", "Phường Hội Nghĩa"],
        "Thành phố Dĩ An": ["Phường Dĩ An", "Phường Tân Đông Hiệp", "Phường Bình Thắng", "Phường Đông Hòa", "Phường An Bình"],
        "Thành phố Thuận An": ["Phường Thuận An", "Phường Bình Chuẩn", "Phường Vĩnh Phú", "Phường Bình Nhâm", "Phường An Phú", "Phường Lái Thiêu"]
    },
    "Tỉnh Đồng Nai": {
        "Thành phố Biên Hòa": ["Phường Trung Dũng", "Phường Bảo Vinh", "Phường Xuân Lạc", "Phường Quyết Thắng", "Phường Thanh Bình", "Phường Trảng Dài", "Phường Tân Biên", "Phường Hố Nai", "Phường Long Bình", "Phường Tam Hiệp", "Phường Long Bình B", "Phường Tân Hạnh", "Phường Phước Tân", "Phường Hưng Đạo"],
        "Thành phố Long Khánh": ["Phường Xuân Bình", "Phường Xuân Hưng", "Phường Xuân Thành", "Phường Xuân Lập", "Phường Bảo Quang"],
        "Huyện Trảng Bom": ["Thị trấn Trảng Bom", "Xã Bắc Sơn", "Xã Hố Nai", "Xã Tây Hòa", "Xã Bình Minh"],
        "Huyện Thống Nhất": ["Thị trấn Dầu Giây", "Xã Lộ 25", "Xã Bàu Hàm", "Xã Hưng Thịnh", "Xã Thanh Bình"],
        "Huyện Cẩm Mỹ": ["Thị trấn Cẩm Mỹ", "Xã Bảo Bình", "Xã Lâm San", "Xã Nhân Nghĩa", "Xã Phú Cường"],
        "Huyện Long Thành": ["Thị trấn Long Thành", "Xã An Phước", "Xã Bình Sơn", "Xã Tam An", "Xã Long Đức"],
        "Huyện Xuân Lộc": ["Thị trấn Xuân Lộc", "Xã Xuân Hưng", "Xã Xuân Tâm", "Xã Suối Rao", "Xã Bảo Hòa"]
    },
    "Tỉnh Bà Rịa - Vũng Tàu": {
        "Thành phố Vũng Tàu": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường Thắng Tam", "Phường Thắng Nhất", "Phường Nguyễn An Ninh", "Phường Rạng Đông"],
        "Thành phố Bà Rịa": ["Phường Phước Hưng", "Phường Phước Hiệp", "Phường Long Toàn", "Phường Long Tâm", "Phường Phước Nguyên", "Phường Phước Bình"],
        "Huyện Châu Đức": ["Thị trấn Ngãi Giao", "Xã Bình Ba", "Xã Suối Rao", "Xã Xuân Sơn", "Xã Bình Giã"],
        "Huyện Xuyên Mộc": ["Thị trấn Phước Bửu", "Xã Xuyên Mộc", "Xã Bông Trang", "Xã Tân Lâm", "Xã Phước Tân"],
        "Huyện Côn Đảo": ["Xã Côn Đảo", "Xã Bình Ba", "Xã An Sơn"]
    },
    "Tỉnh Long An": {
        "Thành phố Tân An": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường Hướng Thọ Phú", "Phường Bình Tân", "Phường Khánh Hậu"],
        "Thị xã Kiến Tường": ["Phường 1", "Phường 2", "Phường 3", "Phường Bình Hiệp", "Phường Long Bình"],
        "Huyện Đức Hòa": ["Thị trấn Đức Hòa", "Xã Mỹ Hạnh Bắc", "Xã Mỹ Hạnh Nam", "Xã Hựu Thạnh", "Xã Đức Hòa Hạ", "Xã Đức Hòa Thượng"],
        "Huyện Bến Lức": ["Thị trấn Bến Lức", "Xã Lương Bình", "Xã Lương Hòa", "Xã Tân Bửu", "Xã Long Hiệp"],
        "Huyện Cần Giuộc": ["Thị trấn Cần Giuộc", "Xã Phước Lý", "Xã Cầu Tràm", "Xã Long Thượng", "Xã Tân Lập"]
    },
    "Tỉnh Tiền Giang": {
        "Thành phố Mỹ Tho": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường Tân Long", "Phường Đạo Thạnh", "Phường Mỹ Phong", "Phường Trung An"],
        "Thị xã Gò Công": ["Phường Gò Công", "Phường Long Chánh", "Phường Long Hòa", "Phường Bình Đông", "Phường Bình Xuân"],
        "Huyện Cái Bè": ["Thị trấn Cái Bè", "Xã Hậu Mỹ", "Xã Mỹ Đức", "Xã Hòa Khánh", "Xã An Cư"],
        "Huyện Châu Thành": ["Thị trấn Tân Hiệp", "Xã Dưỡng Điềm", "Xã Đông Hòa", "Xã Nhị Bình", "Xã Bình Đức"],
        "Huyện Gò Công Tây": ["Thị trấn Vĩnh Bình", "Xã Bình Nhì", "Xã Bình Phong", "Xã Tân Đông", "Xã Tân Thành"]
    },
    "Tỉnh Bến Tre": {
        "Thành phố Bến Tre": ["Phường An Hội", "Phường Phú Hưng", "Phường Phú Khương", "Phường Sơn Đồng", "Phường Bình Phú", "Phường Mỹ Thạnh", "Phường Nhơn Thạnh", "Phường 8"],
        "Huyện Chợ Lách": ["Thị trấn Chợ Lách", "Xã Phú Nghĩa", "Xã Tân Thiềng", "Xã Hưng Khánh Trung B", "Xã Vĩnh Bình"],
        "Huyện Mỏ Cày Nam": ["Thị trấn Mỏ Cày", "Xã Định Thủy", "Xã An Định", "Xã Thanh Tân", "Xã Hương Mỹ"],
        "Huyện Ba Tri": ["Thị trấn Ba Tri", "Xã Bảo Thạnh", "Xã Bảo Nhựt", "Xã Phước Ngãi", "Xã An Phú Trung"]
    },
    "Tỉnh Trà Vinh": {
        "Thành phố Trà Vinh": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường Long Đức", "Phường Ngãi Xuyên"],
        "Huyện Cầu Kè": ["Thị trấn Cầu Kè", "Xã Hòn Đất", "Xã An Phú Tân", "Xã Ninh Thới", "Xã Phong Thạnh"],
        "Huyện Tiểu Cần": ["Thị trấn Tiểu Cần", "Xã Hiếu Tử", "Xã Hùng Hưng", "Xã Long Thành", "Xã Tập Ngãi"],
        "Huyện Cầu Ngang": ["Thị trấn Cầu Ngang", "Xã Mỹ Hòa", "Xã Nhị Trường", "Xã Trường Long Hòa", "Xã Hiệp Hòa"]
    },
    "Tỉnh Vĩnh Long": {
        "Thành phố Vĩnh Long": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường Tân Ngãi", "Phường Đạo Thạnh", "Phường Trường An"],
        "Huyện Bình Minh": ["Thị trấn Bình Minh", "Xã Đông Thạnh", "Xã Tân Quới", "Xã Thành Lợi", "Xã Mỹ Hòa"],
        "Huyện Trà Ôn": ["Thị trấn Trà Ôn", "Xã Xuân Hiệp", "Xã Hòa Bình", "Xã Tích Mỹ", "Xã Lục Sỹ Thành"],
        "Huyện Vũng Liêm": ["Thị trấn Vũng Liêm", "Xã Trung Thành", "Xã Tân An", "Xã Đôn Xuân", "Xã Hiếu Phụng"]
    },
    "Tỉnh Đồng Tháp": {
        "Thành phố Cao Lãnh": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường Hội Phú", "Phường Mỹ Phú", "Phường Tân Quy Đông", "Phường Quy Đức"],
        "Thành phố Sa Đéc": ["Phường 1", "Phường 2", "Phường 3", "Phường Sa Đéc", "Phường An Lạc", "Phường Tân Quy Đông", "Phường Quách Thị Giang"],
        "Thị xã Hồng Ngự": ["Phường An Lạc", "Phường An Bình", "Phường Bình Thạnh", "Phường Long Châu", "Phường Long Thuận"],
        "Huyện Tam Nông": ["Thị trấn Tràm Chim", "Xã Phú Điền", "Xã Tân Công Sính", "Xã Hòa Bình", "Xã Phú Ninh"]
    },
    "Tỉnh An Giang": {
        "Thành phố Long Xuyên": ["Phường Mỹ Long", "Phường Mỹ Phước", "Phường Bình Đức", "Phường Đông Hải", "Phường Mỹ Thới", "Phường Mỹ Quý", "Phường Bình Khánh", "Phường Cồn Bông", "Phường Vĩnh Mỹ"],
        "Thành phố Châu Đốc": ["Phường Châu Phú A", "Phường Châu Phú B", "Phường Đông Hải", "Phường Vĩnh Mỹ", "Phường Vĩnh Nguơn", "Phường Vĩnh Châu"],
        "Huyện An Phú": ["Thị trấn An Phú", "Xã Khánh An", "Xã Quốc Thái", "Xã Phú Hữu", "Xã Vĩnh Lộc"],
        "Huyện Tân Châu": ["Thị trấn Tân Châu", "Xã Tân An", "Xã Tân Hiệp", "Xã Phú Lộc", "Xã Lê Chánh"]
    },
    "Tỉnh Kiên Giang": {
        "Thành phố Rạch Giá": ["Phường Vĩnh Thanh", "Phường Vĩnh Thông", "Phường Vĩnh Lạc", "Phường Ngọc Châu", "Phường Ngọc Hà", "Phường Dương Đông", "Phường An Bình", "Phường Phi Thông"],
        "Thành phố Phú Quốc": ["Phường Dương Đông", "Phường An Thới", "Phường Cửa Cạn", "Phường Gành Gió", "Phường Hàm Ninh", "Phường Dương Tơ", "Phường Bãi Thơm", "Phường Thổ Châu"],
        "Huyện Hà Tiên": ["Thị trấn Hà Tiên", "Xã Thuận Yên", "Xã Tiên Hải", "Xã Đông Hưng", "Xã Phú Mỹ"],
        "Huyện Kiên Hải": ["Thị trấn Dương Đông", "Xã Cửa Cạn", "Xã Gành Gió", "Xã Hàm Ninh", "Xã Dương Tơ"]
    },
    "Tỉnh Hậu Giang": {
        "Thành phố Vị Thanh": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường Vị Tân", "Phường Hoả Lựu B", "Phường Hoả Tiến"],
        "Thị xã Ngã Bảy": ["Phường Ngã Bảy", "Phường Lái Hiếu", "Phường Đại Thành", "Phường Tân Thành", "Phường Mỹ Hòa"],
        "Huyện Châu Thành": ["Thị trấn Châu Thành", "Xã Đại Thành", "Xã Nguyễn Văn Thảo", "Xã Phú Hữu", "Xã Thạnh Xuân"],
        "Huyện Phụng Hiệp": ["Thị trấn Phụng Hiệp", "Xã Hiệp Hưng", "Xã Hưng Phú", "Xã Long Bình", "Xã Tân Phong"]
    },
    "Tỉnh Sóc Trăng": {
        "Thành phố Sóc Trăng": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10"],
        "Huyện Châu Thành": ["Thị trấn Châu Thành", "Xã Hồ Đắc Kiện", "Xã Phú Tân", "Xã Thiện Mỹ", "Xã Thạnh Trị"],
        "Huyện Mỹ Tú": ["Thị trấn Mỹ Tú", "Xã Mỹ Hương", "Xã Mỹ Phước", "Xã Long Hưng", "Xã Củ Mỹ"],
        "Huyện Ngã Năm": ["Thị trấn Ngã Năm", "Xã Vĩnh Quới", "Xã Tân Long", "Xã Nhơn Mỹ", "Xã Mỹ Thạnh"]
    },
    "Tỉnh Bạc Liêu": {
        "Thành phố Bạc Liêu": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 7", "Phường 8", "Phường Nhà Mát"],
        "Huyện Hồng Dân": ["Thị trấn Hồng Dân", "Xã Nhà Mát", "Xã Vĩnh Trạch", "Xã Vĩnh Trạch Thượng", "Xã Lộc Ninh"],
        "Huyện Phước Long": ["Thị trấn Phước Long", "Xã Vĩnh Phong", "Xã Vĩnh Phú Đông", "Xã Hưng Phú", "Xã Phước Long Thọ"],
        "Huyện Đông Hải": ["Thị trấn Gành Hào", "Xã Long Điền Đông", "Xã Long Điền Đông A", "Xã Điền Hải", "Xã Hàm Rồng"]
    },
    "Tỉnh Cà Mau": {
        "Thành phố Cà Mau": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường Tắc Vân", "Phường Thới Bình", "Phường Định Bình"],
        "Huyện U Minh": ["Thị trấn U Minh", "Xã Khánh Hòa", "Xã Khánh Thuần", "Xã Khánh An", "Xã Khánh Hội"],
        "Huyện Thới Bình": ["Thị trấn Thới Bình", "Xã Biển Bạch", "Xã Tân Bằng", "Xã Trí Phước", "Xã Bình Thạnh"],
        "Huyện Trần Văn Thời": ["Thị trấn Trần Văn Thời", "Xã Trần Hợp", "Xã Khánh Bình Tây", "Xã Khánh Bình Đông", "Xã Lợi An"]
    },
    "Tỉnh Lai Châu": {
        "Thành phố Lai Châu": ["Phường Tân Phong", "Phường Quyết Thắng", "Phường Quyết Tiến", "Phường Đoàn Kết", "Phường Sùng Phai"],
        "Huyện Tam Đường": ["Thị trấn Tam Đường", "Xã Sủng Mỏ", "Xã Khum", "Xã Phình Sáng", "Xã Tả Lèng"],
        "Huyện Sìn Hồ": ["Thị trấn Sìn Hồ", "Xã Pa Tần", "Xã Phền Hồ", "Xã Tả Phìn", "Xã Nậm Tăm"],
        "Huyện Phong Thổ": ["Thị trấn Phong Thổ", "Xã Mường So", "Xã Mường Than", "Xã Pa Vây Sử", "Xã Vàng Ma Chải"]
    },
    "Tỉnh Điện Biên": {
        "Thành phố Điện Biên Phủ": ["Phường Mường Thanh", "Phường Noong Bua", "Phường Him Lam", "Phường Thanh Bình", "Phường Tân Thanh", "Phường Mường Phăng", "Phường Na Tam"],
        "Thị xã Mường Lay": ["Phường Mường Lay", "Phường Sông Đà", "Phường Na Lay", "Phường Xa Lay"],
        "Huyện Điện Biên": ["Thị trấn Điện Biên Đông", "Xã Mường Luân", "Xã Mường Lói", "Xã Phình Giàng", "Xã Tả Pờ Sa"],
        "Huyện Mường Chà": ["Thị trấn Mường Chà", "Xã Mường Tùng", "Xã Pa Tần", "Xã Cờ Lên", "Xã Mường Mươn"]
    },
    "Tỉnh Sơn La": {
        "Thành phố Sơn La": ["Phường Chiềng Lề", "Phường Chiềng Xôm", "Phường Quyết Thắng", "Phường Quyết Tiến", "Phường Chiềng Cọ", "Phường Bản Yên", "Phường Tô Hiệu", "Phường Chiềng An"],
        "Huyện Mộc Châu": ["Thị trấn Mộc Châu", "Xã Đông Sang", "Xã Mường Sang", "Xã Tân Lập", "Xã Nà Mường"],
        "Huyện Yên Châu": ["Thị trấn Yên Châu", "Xã Chiềng Sàng", "Xã Chiềng Pằc", "Xã Lóng Phiêng", "Xã Muội Nọi"],
        "Huyện Mai Sơn": ["Thị trấn Hát Lót", "Xã Chiềng Sơn", "Xã Mường Bằng", "Xã Phù Yên", "Xã Chiềng Tương"]
    },
    "Tỉnh Lào Cai": {
        "Thành phố Lào Cai": ["Phường Bắc Lệnh", "Phường Cốc Lếu", "Phường Duyên Hải", "Phường Kim Tân", "Phường Lào Cai", "Phường Nam Cường", "Phường Phố Mới", "Phường Pom Hán", "Phường Xuân Tường"],
        "Thị xã Sa Pa": ["Phường Sa Pa", "Phường Cầu Mây", "Phường Hàm Rồng", "Phường Ô Quý Hồ", "Phường Phan Si Păng Tả", "Phường Trung Chải"],
        "Huyện Bát Xát": ["Thị trấn Bát Xát", "Xã Bản Vược", "Xã Mường Vi", "Xã A Mú Sung", "Xã Trịnh Tây"],
        "Huyện Bảo Thắng": ["Thị trấn Phố Lu", "Thị trấn Tằng Loỏng", "Xã Bản Cầm", "Xã Gia Phú", "Xã Sơn Hà"]
    },
    "Tỉnh Yên Bái": {
        "Thành phố Yên Bái": ["Phường Đồng Tâm", "Phường Hồng Hà", "Phường Minh Tân", "Phường Nguyễn Phúc", "Phường Yên Ninh", "Phường Yên Thịnh", "Phường Yên Thành"],
        "Thị xã Nghĩa Lộ": ["Phường Nghĩa Lộ", "Phường Pú Trạng", "Phường Trung Tâm", "Phường Tân An"],
        "Huyện Yên Bình": ["Thị trấn Yên Bình", "Xã Thác Bạc", "Xã Cảm Nhân", "Xã Ngọc Chấn", "Xã Tân Hương"],
        "Huyện Văn Chấn": ["Thị trấn Nghĩa Lợi", "Xã Cảm Nhân", "Xã Chấn Thịnh", "Xã Gia Hội", "Xã Nghĩa Tân"]
    },
    "Tỉnh Hoà Bình": {
        "Thành phố Hòa Bình": ["Phường Thái Bình", "Phường Tân Hòa", "Phường Đồng Tâm", "Phường Hữu Nghị", "Phường Quỳnh Lâm", "Phường Thịnh Lang", "Phường Phương Lâm"],
        "Huyện Kỳ Sơn": ["Thị trấn Kỳ Sơn", "Xã Hợp Thành", "Xã Phú Nghĩa", "Xã Tân Vinh", "Xã Nhân Đạo"],
        "Huyện Lương Sơn": ["Thị trấn Lương Sơn", "Xã Lâm Sơn", "Xã Hòe Sơn", "Xã Thanh Cao", "Xã Thanh Lương"],
        "Huyện Kim Bôi": ["Thị trấn Bo", "Xã Bắc Sơn", "Xã Đông Sơn", "Xã Kim Sơn", "Xã Miền Đồi"]
    },
    "Tỉnh Thái Nguyên": {
        "Thành phố Thái Nguyên": ["Phường Quán Trữ", "Phường Quang Vinh", "Phường Tân Thịnh", "Phường Thịnh Đán", "Phường Trưng Vương", "Phường Trung Thành", "Phường Phan Đình Phù", "Phường Tiên Sơn", "Phường Tân Cương"],
        "Thành phố Sông Công": ["Phường Sông Công", "Phường Cầu Gồ", "Phường Mỏ Chè", "Phường Lương Sơn", "Phường Thắng Lợi"],
        "Huyện Đại Từ": ["Thị trấn Đại Từ", "Xã Hùng Sơn", "Xã Quân Chu", "Xã Bản Ngoại", "Xã Phú Xuyên"],
        "Huyện Phổ Yên": ["Thị trấn Bãi Bông", "Thị trấn Phổ Yên", "Xã Đắc Sơn", "Xã Phú Đô", "Xã Vạn Phái"]
    },
    "Tỉnh Lạng Sơn": {
        "Thành phố Lạng Sơn": ["Phường Chi Lăng", "Phường Đông Kinh", "Phường Hoàng Văn Thụ", "Phường Mai Pha", "Phường Tam Thanh", "Phường Vĩnh Trại"],
        "Huyện Tràng Định": ["Thị trấn Thất Khê", "Xã Bắc Ái", "Xã Đại Đồng", "Xã Hùng Việt", "Xã Quang Trung"],
        "Huyện Bắc Sơn": ["Thị trấn Bắc Sơn", "Xã Hưng Đạo", "Xã Vạn Thủy", "Xã Bắc Sơn", "Xã Long Đức"],
        "Huyện Văn Lãng": ["Thị trấn Na Sầm", "Xã Bính Xá", "Xã Hội Hoan", "Xã Thanh Sơn", "Xã Gia Miễn"]
    },
    "Tỉnh Cao Bằng": {
        "Thành phố Cao Bằng": ["Phường Sông Hiến", "Phường Sông Bằng", "Phường Hợp Giang", "Phường Tân Giang", "Phường Đề Thám", "Phường Ngọc Xuân", "Phường Hoà Chung"],
        "Huyện Bảo Lạc": ["Thị trấn Bảo Lạc", "Xã Cô Ba", "Xã Bảo Toàn", "Xã Phan Thanh", "Xã Hồng Đức"],
        "Huyện Hà Quảng": ["Thị trấn Hà Quảng", "Xã Cảnh Bình", "Xã Đào Ngạn", "Xã Hồng Sĩ", "Xã Quý Hưng"],
        "Huyện Thạch An": ["Thị trấn Đông Khê", "Xã Đức Long", "Xã Dân Chủ", "Xã Quang Trọng", "Xã Thịnh Vượng"]
    },
    "Tỉnh Tuyên Quang": {
        "Thành phố Tuyên Quang": ["Phường An Khang", "Phường Đội Cấn", "Phường Hưng Thành", "Phường Minh Xuân", "Phường Nông Tiến", "Phường Phan Thiết", "Phường Tân Quang"],
        "Huyện Yên Sơn": ["Thị trấn Yên Sơn", "Xã Kiến Thiết", "Xã Trung Minh", "Xã Xuân Vân", "Xã Tân Long"],
        "Huyện Hàm Yên": ["Thị trấn Hàm Yên", "Xã Bình An", "Xã Thành Long", "Xã Yên Thuận", "Xã Hùng Đức"],
        "Huyện Chiêm Hóa": ["Thị trấn Chiêm Hóa", "Xã Bình Nhân", "Xã Hàm Nghi", "Xã Ngọc Hội", "Xã Phú Bình"]
    },
    "Tỉnh Phú Thọ": {
        "Thành phố Việt Trì": ["Phường Bạch Hạc", "Phường Dữu Lâu", "Phường Gia Cẩm", "Phường Hùng Vương", "Phường Minh Nông", "Phường Nông Văn", "Phường Tiên Cát", "Phường Thọ Sơn", "Phường Vân Cốc"],
        "Thị xã Phú Thọ": ["Phường Phú Thọ", "Phường Hà Thạch", "Phường Hùng Vương", "Phường Thanh Minh", "Phường Văn Lung"],
        "Huyện Đoan Hùng": ["Thị trấn Đoan Hùng", "Xã Hùng Xuyên", "Xã Bắc Nham", "Xã Vân Đồn", "Xã Tiên Phú"],
        "Huyện Thanh Ba": ["Thị trấn Thanh Ba", "Xã Đỗ Sơn", "Xã Đỗ Xuyên", "Xã Khải Xuân", "Xã Thanh Vân"]
    },
    "Tỉnh Bắc Kạn": {
        "Thành phố Bắc Kạn": ["Phường Đức Xuân", "Phường Nguyễn Thị Minh Khai", "Phường Phù Mỹ", "Phường Sông Cầu", "Phường Xuất Hóa"],
        "Huyện Chợ Đồn": ["Thị trấn Bản Đồng", "Xã Bản Liều", "Xã Đại Sảo", "Xã Lương Thượng", "Xã Tân Sơn"],
        "Huyện Ba Bể": ["Thị trấn Bể", "Xã Bạch Thông", "Xã Cao Thượng", "Xã Hà Hiệu", "Xã Quản Bạ"],
        "Huyện Ngân Sơn": ["Thị trấn Nặm Đăm", "Xã Bằng Vân", "Xã Cốc Đán", "Xã Lượng Vân Khê", "Xã Thượng Quan"]
    },
    "Tỉnh Hà Giang": {
        "Thành phố Hà Giang": ["Phường Minh Khai", "Phường Ngọc Đường", "Phường Quang Trung", "Phường Trần Phú", "Phường Vị Xuyên", "Phường Phương Độ"],
        "Huyện Đồng Văn": ["Thị trấn Đồng Văn", "Xã Lũng Cú", "Xã Mèo Vạc", "Xã Pải Lủ", "Xã Tả Lủng"],
        "Huyện Mèo Vạc": ["Thị trấn Mèo Vạc", "Xã Giàng Chu Phìn", "Xã Khâu Vai", "Xã Lũng Pồ", "Xã Pả Vi"],
        "Huyện Yên Minh": ["Thị trấn Yên Minh", "Xã Bạch Đích", "Xã Du Già", "Xã Du Tiến", "Xã Mậu Long"]
    },
    "Tỉnh Cao Lãnh": {
        "Thành phố Cao Lãnh": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường Mỹ Trà", "Phường Mỹ Tân", "Phường Hoà Bình", "Phường Tân Thuận"],
        "Thị xã Mỹ Tho": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8"]
    }
};

// Helper function to get provinces
function getProvinces() {
    return Object.keys(VIETNAM_ADDRESS);
}

// Helper function to get districts by province
function getDistricts(province) {
    if (!province || !VIETNAM_ADDRESS[province]) return [];
    return Object.keys(VIETNAM_ADDRESS[province]);
}

// Helper function to get wards by province and district
function getWards(province, district) {
    if (!province || !district || !VIETNAM_ADDRESS[province] || !VIETNAM_ADDRESS[province][district]) return [];
    return VIETNAM_ADDRESS[province][district];
}
