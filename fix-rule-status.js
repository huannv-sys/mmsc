import * as fs from 'fs';

// Đường dẫn đến file RulesList.tsx
const filePath = 'client/src/components/rules/RulesList.tsx';

// Đọc nội dung file
let content = fs.readFileSync(filePath, 'utf8');

// Thay thế tất cả các trường hợp so sánh getStatusBadge(rule.disabled === 'true')
content = content.replace(/getStatusBadge\(rule\.disabled === 'true'\)/g, 'getStatusBadge(rule.disabled)');

// Ghi nội dung đã sửa lại vào file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Đã hoàn thành việc sửa các so sánh rule.disabled trong file RulesList.tsx');