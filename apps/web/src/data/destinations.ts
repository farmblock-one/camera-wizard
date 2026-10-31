export type CityId = 'chongqing' | 'chengdu' | 'generic';

export interface Destination {
  id: string;
  city: CityId;
  name: string;
  zh: string;
  /** Search terms to paste into 小红书 / 抖音 / TikTok / Instagram. */
  keywords: string[];
}

export const CITIES: { id: CityId; name: string; zh?: string }[] = [
  { id: 'chongqing', name: 'Trùng Khánh', zh: '重庆' },
  { id: 'chengdu', name: 'Thành Đô', zh: '成都' },
  { id: 'generic', name: 'Dáng chung (dùng ở đâu cũng được)' },
];

function place(id: string, city: CityId, name: string, zh: string, extra: string[] = []): Destination {
  return { id, city, name, zh, keywords: [`${zh}拍照`, `${zh}拍照姿势`, `${zh}情侣拍照`, `${zh}机位`, ...extra] };
}

function generic(id: string, name: string, keywords: string[]): Destination {
  return { id, city: 'generic', name, zh: keywords[0], keywords };
}

export const DESTINATIONS: Destination[] = [
  place('cq-hongyadong', 'chongqing', 'Hồng Nhai Động', '洪崖洞', ['洪崖洞夜景拍照', 'hongyadong']),
  place('cq-liziba', 'chongqing', 'Ga Lý Tử Bá (tàu xuyên nhà)', '李子坝轻轨', ['liziba station']),
  place('cq-jiefangbei', 'chongqing', 'Giải Phóng Bi', '解放碑'),
  place('cq-cableway', 'chongqing', 'Cáp treo sông Trường Giang', '长江索道'),
  place('cq-ciqikou', 'chongqing', 'Từ Khí Khẩu', '磁器口'),
  place('cq-shibati', 'chongqing', 'Thập Bát Thê', '十八梯'),
  place('cq-eling', 'chongqing', 'Nga Lĩnh Nhị Xưởng', '鹅岭二厂'),
  place('cq-kuixing', 'chongqing', 'Khôi Tinh Lâu', '魁星楼'),
  place('cq-raffles', 'chongqing', 'Triều Thiên Môn / Lai Phúc Sĩ', '来福士', ['朝天门拍照']),
  place('cd-kuanzhai', 'chengdu', 'Khoan Trách Hạng Tử', '宽窄巷子'),
  place('cd-jinli', 'chengdu', 'Cẩm Lý', '锦里'),
  place('cd-wuhou', 'chengdu', 'Vũ Hầu Từ', '武侯祠'),
  place('cd-taikooli', 'chengdu', 'Thái Cổ Lý / Xuân Hy Lộ', '太古里', ['春熙路拍照']),
  place('cd-ifs', 'chengdu', 'Gấu trúc leo tòa IFS', '成都IFS熊猫'),
  place('cd-wenshu', 'chengdu', 'Văn Thù Viện', '文殊院'),
  place('cd-panda', 'chengdu', 'Cơ sở gấu trúc', '熊猫基地'),
  place('cd-anshun', 'chengdu', 'Cầu An Thuận', '安顺廊桥'),
  place('cd-renmin', 'chengdu', 'Nhân Dân Công Viên', '人民公园'),
  place('cd-dujiangyan', 'chengdu', 'Đô Giang Yển', '都江堰'),
  generic('g-stairs', 'Cầu thang', ['楼梯拍照姿势', '台阶拍照姿势']),
  generic('g-street', 'Đường phố', ['街拍姿势', '街拍姿势 情侣']),
  generic('g-night', 'Phố đêm / đèn neon', ['夜景拍照姿势', '夜景人像姿势']),
  generic('g-cafe', 'Quán cà phê / quán trà', ['咖啡店拍照姿势', '茶馆拍照']),
  generic('g-river', 'Lan can / bờ sông', ['江边拍照姿势', '栏杆拍照姿势']),
  generic('g-oldstreet', 'Phố cổ / tường cổ', ['古街拍照姿势', '古镇拍照姿势']),
  generic('g-winter', 'Mùa đông / áo khoác', ['冬天拍照姿势', '冬季穿搭拍照']),
];

export const DEST_BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]));

export const PRESET_TAGS = [
  'đứng',
  'ngồi',
  'đi bộ',
  'dựa tường',
  'quay lưng',
  'nhìn xa',
  'cầu thang',
  'đêm',
  'toàn thân',
  'nửa người',
  'cận cảnh',
  'đạo cụ',
];
