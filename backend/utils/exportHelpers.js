const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Generate Excel file buffer
const generateExcelReport = async (records, title = 'Attendance Report') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Data');

  worksheet.columns = [
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Roll Number', key: 'rollNumber', width: 15 },
    { header: 'Course', key: 'course', width: 25 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Time', key: 'time', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4F46E5' }, // Indigo color
  };

  records.forEach((record) => {
    worksheet.addRow({
      studentName: record.studentId?.name || record.studentName || 'N/A',
      rollNumber: record.studentId?.rollNumber || record.rollNumber || 'N/A',
      course: record.courseId?.name || record.courseName || 'N/A',
      department: record.studentId?.departmentName || record.department || 'Computer Science',
      date: new Date(record.timestamp || record.createdAt).toLocaleDateString(),
      time: new Date(record.timestamp || record.createdAt).toLocaleTimeString(),
      status: (record.status || 'present').toUpperCase(),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// Generate PDF Stream
const generatePDFReport = (records, res, title = 'Attendance Report') => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`);

  doc.pipe(res);

  // Title
  doc.fillColor('#4F46E5').fontSize(20).text(title, { align: 'center' });
  doc.moveDown();
  doc.fillColor('#666666').fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1.5);

  // Table Headers
  const startX = 30;
  let startY = doc.y;
  const colWidths = [120, 80, 130, 80, 70, 50];

  doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold');
  doc.text('Student Name', startX, startY);
  doc.text('Roll No.', startX + colWidths[0], startY);
  doc.text('Course', startX + colWidths[0] + colWidths[1], startY);
  doc.text('Date', startX + colWidths[0] + colWidths[1] + colWidths[2], startY);
  doc.text('Time', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], startY);
  doc.text('Status', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], startY);

  doc.moveTo(startX, startY + 15).lineTo(startX + 530, startY + 15).stroke('#CBD5E1');
  startY += 25;

  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  records.forEach((record, index) => {
    if (startY > 750) {
      doc.addPage();
      startY = 40;
    }

    const studentName = record.studentId?.name || record.studentName || 'N/A';
    const rollNo = record.studentId?.rollNumber || record.rollNumber || 'N/A';
    const course = record.courseId?.name || record.courseName || 'N/A';
    const date = new Date(record.timestamp || record.createdAt).toLocaleDateString();
    const time = new Date(record.timestamp || record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const status = (record.status || 'present').toUpperCase();

    doc.text(studentName.substring(0, 18), startX, startY);
    doc.text(rollNo, startX + colWidths[0], startY);
    doc.text(course.substring(0, 20), startX + colWidths[0] + colWidths[1], startY);
    doc.text(date, startX + colWidths[0] + colWidths[1] + colWidths[2], startY);
    doc.text(time, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], startY);

    if (status === 'PRESENT') {
      doc.fillColor('#16A34A').text(status, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], startY);
    } else {
      doc.fillColor('#DC2626').text(status, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], startY);
    }
    doc.fillColor('#334155');

    startY += 20;
  });

  doc.end();
};

module.exports = { generateExcelReport, generatePDFReport };
