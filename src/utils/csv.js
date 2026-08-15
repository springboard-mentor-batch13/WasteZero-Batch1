const BOM = '\uFEFF';
const ARRAY_SEPARATOR = '|';
const CRLF = '\r\n';

const escapeField = (value) => {
  if (value === null || value === undefined) return '';
  let field;
  if (value instanceof Date) {
    field = value.toISOString();
  } else if (Array.isArray(value)) {
    field = value.map(String).join(ARRAY_SEPARATOR);
  } else if (typeof value === 'object') {
    field = JSON.stringify(value);
  } else {
    field = String(value);
  }
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

const toCsv = (columns, rows) => {
  const lines = [columns.join(',')];
  rows.forEach((row) => {
    lines.push(columns.map((column) => escapeField(row[column])).join(','));
  });
  return BOM + lines.join(CRLF) + CRLF;
};

const buildCsvFilename = (report, to) => {
  const date = to ? new Date(to) : new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `wastezero-${report}-report-${year}-${month}-${day}.csv`;
};

const sendCsvResponse = (res, filename, content) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(content);
};

module.exports = { toCsv, buildCsvFilename, sendCsvResponse };
