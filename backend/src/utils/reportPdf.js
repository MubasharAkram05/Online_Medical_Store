import PDFDocument from 'pdfkit';

const formatCurrency = (value) => `PKR ${Number(value || 0).toFixed(2)}`;

export const generateSalesReportPDF = (reportData, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  const { summary, dailyData } = reportData;

  // Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('Sales Report', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    .moveDown(1);

  // Summary Section
  doc.fontSize(16).font('Helvetica-Bold').text('Summary').moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Total Orders: ${summary.totalOrders}`, 50);
  doc.text(`Total Revenue: ${formatCurrency(summary.totalRevenue)}`, 50);
  doc.text(`Average Daily Revenue: ${formatCurrency(summary.averageDailyRevenue)}`, 50);
  doc.moveDown(1);

  // Daily Breakdown
  if (dailyData && dailyData.length > 0) {
    doc.fontSize(16).font('Helvetica-Bold').text('Daily Breakdown').moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Date', 50, doc.y, { continued: true });
    doc.text('Orders', 200, doc.y, { continued: true });
    doc.text('Revenue', 300, doc.y);
    doc.moveDown(0.3);
    doc.font('Helvetica');

    dailyData.forEach((day) => {
      const startY = doc.y;
      doc.text(new Date(day.date).toLocaleDateString(), 50, startY, { width: 150 });
      doc.text(String(day.orders), 200, startY, { width: 80 });
      doc.text(formatCurrency(day.revenue || 0), 300, startY, { width: 150 });
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

export const generateInventoryReportPDF = (reportData, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  const { summary, products } = reportData;

  // Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('Inventory Report - Low Stock Products', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    .moveDown(1);

  // Summary
  doc.fontSize(16).font('Helvetica-Bold').text('Summary').moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Low Stock Items: ${summary.totalItems}`, 50);
  doc.text(`Total Stock Value: ${formatCurrency(summary.totalValue)}`, 50);
  doc.moveDown(1);

  // Products List
  if (products && products.length > 0) {
    doc.fontSize(16).font('Helvetica-Bold').text('Low Stock Products').moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Product Name', 50, doc.y, { continued: true });
    doc.text('Category', 200, doc.y, { continued: true });
    doc.text('Stock', 280, doc.y, { continued: true });
    doc.text('Price', 330, doc.y, { continued: true });
    doc.text('Expiry', 400, doc.y);
    doc.moveDown(0.3);
    doc.font('Helvetica');

    products.forEach((product) => {
      const startY = doc.y;
      if (startY > 700) {
        doc.addPage();
      }
      doc.text(product.name || '—', 50, startY, { width: 150 });
      doc.text(product.category || '—', 200, startY, { width: 80 });
      doc.text(String(product.stock || 0), 280, startY, { width: 50 });
      doc.text(formatCurrency(product.price || 0), 330, startY, { width: 70 });
      doc.text(
        product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '—',
        400,
        startY,
        { width: 100 }
      );
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

export const generateExpiryReportPDF = (reportData, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  const { summary, products } = reportData;

  // Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('Expiry Report - Expiring Products', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    .text('Next 30 Days', { align: 'center' })
    .moveDown(1);

  // Summary
  doc.fontSize(16).font('Helvetica-Bold').text('Summary').moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Expiring Items: ${summary.totalItems}`, 50);
  doc.text(`Total Stock Value: ${formatCurrency(summary.totalValue)}`, 50);
  doc.moveDown(1);

  // Products List
  if (products && products.length > 0) {
    doc.fontSize(16).font('Helvetica-Bold').text('Expiring Products').moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Product Name', 50, doc.y, { continued: true });
    doc.text('Category', 200, doc.y, { continued: true });
    doc.text('Stock', 280, doc.y, { continued: true });
    doc.text('Price', 330, doc.y, { continued: true });
    doc.text('Expiry Date', 400, doc.y);
    doc.moveDown(0.3);
    doc.font('Helvetica');

    products.forEach((product) => {
      const startY = doc.y;
      if (startY > 700) {
        doc.addPage();
      }
      doc.text(product.name || '—', 50, startY, { width: 150 });
      doc.text(product.category || '—', 200, startY, { width: 80 });
      doc.text(String(product.stock || 0), 280, startY, { width: 50 });
      doc.text(formatCurrency(product.price || 0), 330, startY, { width: 70 });
      doc.text(
        product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '—',
        400,
        startY,
        { width: 100 }
      );
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

