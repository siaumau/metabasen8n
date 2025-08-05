export interface ColumnInfo {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'enum';
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

const mockTables: TableInfo[] = [
  {
    name: '使用者',
    columns: [
      { name: 'ID', dataType: 'number' },
      { name: '姓名', dataType: 'string' },
      { name: '電子郵件', dataType: 'string' },
      { name: '年齡', dataType: 'number' },
      { name: '註冊日期', dataType: 'date' },
    ],
  },
  {
    name: '產品',
    columns: [
      { name: 'ID', dataType: 'number' },
      { name: '名稱', dataType: 'string' },
      { name: '價格', dataType: 'number' },
      { name: '類別', dataType: 'enum' },
      { name: '庫存', dataType: 'number' },
    ],
  },
];

export type DataRow = Record<string, string | number | boolean | Date>;

const mockData: Record<string, DataRow[]> = {
  '使用者': [
    { ID: 1, '姓名': '愛麗絲', '電子郵件': 'alice@example.com', '年齡': 30, '註冊日期': '2023-01-01' },
    { ID: 2, '姓名': '鮑伯', '電子郵件': 'bob@example.com', '年齡': 24, '註冊日期': '2023-02-15' },
    { ID: 3, '姓名': '查理', '電子郵件': 'charlie@example.com', '年齡': 35, '註冊日期': '2023-03-20' },
    { ID: 4, '姓名': '大衛', '電子郵件': 'david@example.com', '年齡': 28, '註冊日期': '2023-04-10' },
    { ID: 5, '姓名': '伊芙', '電子郵件': 'eve@example.com', '年齡': 22, '註冊日期': '2023-05-05' },
  ],
  '產品': [
    { ID: 101, '名稱': '筆記型電腦', '價格': 35000, '類別': '電子產品', '庫存': 50 },
    { ID: 102, '名稱': '滑鼠', '價格': 800, '類別': '電子產品', '庫存': 200 },
    { ID: 103, '名稱': '鍵盤', '價格': 2500, '類別': '電子產品', '庫存': 100 },
    { ID: 104, '名稱': '辦公椅', '價格': 4500, '類別': '家具', '庫存': 30 },
    { ID: 105, '名稱': '螢幕', '價格': 9000, '類別': '電子產品', '庫存': 75 },
  ],
};

export const getTables = (): Promise<TableInfo[]> => {
  return Promise.resolve(mockTables);
};

export const getTableData = (tableName: string): Promise<DataRow[]> => {
  return Promise.resolve(mockData[tableName] || []);
};