export const generateSalesReportCSV = (reportData) => {
  const { summary, dailyData } = reportData;
  let csv = 'Sales Report\n';
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;
  csv += 'Summary\n';
  csv += `Total Orders,${summary.totalOrders}\n`;
  csv += `Total Revenue,${summary.totalRevenue}\n`;
  csv += `Average Daily Revenue,${summary.averageDailyRevenue}\n\n`;

  if (dailyData && dailyData.length > 0) {
    csv += 'Daily Breakdown\n';
    csv += 'Date,Orders,Revenue\n';
    dailyData.forEach((day) => {
      csv += `${new Date(day.date).toLocaleDateString()},${day.orders},${day.revenue || 0}\n`;
    });
  }

  return csv;
};

export const generateInventoryReportCSV = (reportData) => {
  const { summary, products } = reportData;
  let csv = 'Inventory Report - Low Stock Products\n';
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;
  csv += 'Summary\n';
  csv += `Low Stock Items,${summary.totalItems}\n`;
  csv += `Total Stock Value,${summary.totalValue}\n\n`;

  if (products && products.length > 0) {
    csv += 'Low Stock Products\n';
    csv += 'Product Name,Category,Stock,Price,Expiry Date\n';
    products.forEach((product) => {
      csv += `"${product.name || ''}","${product.category || ''}",${product.stock || 0},${product.price || 0},"${product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : ''}"\n`;
    });
  }

  return csv;
};

export const generateExpiryReportCSV = (reportData) => {
  const { summary, products } = reportData;
  let csv = 'Expiry Report - Expiring Products\n';
  csv += `Generated: ${new Date().toLocaleString()}\n`;
  csv += 'Next 30 Days\n\n';
  csv += 'Summary\n';
  csv += `Expiring Items,${summary.totalItems}\n`;
  csv += `Total Stock Value,${summary.totalValue}\n\n`;

  if (products && products.length > 0) {
    csv += 'Expiring Products\n';
    csv += 'Product Name,Category,Stock,Price,Expiry Date\n';
    products.forEach((product) => {
      csv += `"${product.name || ''}","${product.category || ''}",${product.stock || 0},${product.price || 0},"${product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : ''}"\n`;
    });
  }

  return csv;
};

