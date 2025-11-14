import PDFDocument from 'pdfkit';

const formatCurrency = (value) => `PKR ${Number(value || 0).toFixed(2)}`;

const addKeyValue = (doc, label, value) => {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(value || '—');
};

export const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(invoice.title || 'Invoice', { align: 'center' })
    .moveDown(1.2);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Invoice #: ${invoice.invoiceNumber}`)
    .text(`Order #: ${invoice.orderNumber}`)
    .text(`Order Date: ${new Date(invoice.orderDate).toLocaleString()}`)
    .moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Customer Details').moveDown(0.4);
  doc.fontSize(11);
  addKeyValue(doc, 'Name', invoice.customer?.name);
  addKeyValue(doc, 'Email', invoice.customer?.email);
  addKeyValue(doc, 'Phone', invoice.customer?.phone);
  addKeyValue(doc, 'Address', invoice.customer?.address);
  addKeyValue(doc, 'City / Postal Code', `${invoice.customer?.city || '—'} ${invoice.customer?.postalCode || ''}`);
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Payment').moveDown(0.4);
  doc.fontSize(11);
  addKeyValue(doc, 'Method', invoice.payment?.method);
  addKeyValue(doc, 'Status', invoice.payment?.status);
  addKeyValue(doc, 'Amount', formatCurrency(invoice.payment?.amount));
  if (invoice.payment?.transactionId) {
    addKeyValue(doc, 'Transaction ID', invoice.payment.transactionId);
  }
  if (invoice.payment?.reference) {
    addKeyValue(doc, 'Reference', invoice.payment.reference);
  }
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Items').moveDown(0.4);
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Item', 50, doc.y, { continued: true });
  doc.text('Qty', 260, doc.y, { continued: true });
  doc.text('Unit Price', 300, doc.y, { continued: true });
  doc.text('Total', 400);
  doc.moveDown(0.4);
  doc.font('Helvetica');

  invoice.items.forEach((item) => {
    const startY = doc.y;
    doc.text(item.name, 50, startY, { width: 200 });
    doc.text(String(item.quantity), 260, startY, { width: 40 });
    doc.text(formatCurrency(item.unitPrice), 300, startY, { width: 80, align: 'right' });
    doc.text(formatCurrency(item.totalPrice), 400, startY, { width: 80, align: 'right' });
    doc.moveDown(0.6);
  });

  doc.moveDown();
  doc.fontSize(12).font('Helvetica-Bold').text('Totals', { align: 'right' });
  doc.font('Helvetica');
  doc.text(`Subtotal: ${formatCurrency(invoice.totals?.subtotal)}`, { align: 'right' });
  doc.text(`Tax: ${formatCurrency(invoice.totals?.tax)}`, { align: 'right' });
  doc.text(`Shipping: ${formatCurrency(invoice.totals?.shipping)}`, { align: 'right' });
  doc.font('Helvetica-Bold').text(`Total: ${formatCurrency(invoice.totals?.total)}`, { align: 'right' });
  doc.font('Helvetica');

  doc.moveDown(2);
  doc.fontSize(10).text('Thank you for your purchase!', { align: 'center' });

  doc.end();
};

