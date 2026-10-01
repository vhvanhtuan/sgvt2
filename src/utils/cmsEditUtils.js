// Utility for CMS edit page
// (future: add select options loader, field type mapping, etc.)
export function mapFieldType(type) {
    if (type === 'text' || type === 'varchar' || type === 'char') return 'text';
    if (type === 'int' || type === 'bigint' || type === 'smallint') return 'number';
    if (type === 'textarea' || type === 'longtext') return 'textarea';
    if (type === 'date') return 'date';
    if (type === 'datetime' || type === 'timestamp') return 'datetime-local';
    return 'text';
}
