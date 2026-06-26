import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

// Generate professional Word document quote with mobile-friendly formatting
async function generateQuoteDocument(quoteData) {
  try {
    console.log('📄 Generating Word document quote...');
    console.log('📄 Quote data:', {
      quoteNumber: quoteData.quoteNumber,
      customerName: quoteData.customerName,
      totalAmount: quoteData.totalAmount
    });

    // Format date function
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-GB');
    };

    // Create document with proper mobile-friendly formatting
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in EMUs
              height: 16838, // A4 height in EMUs
            },
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "HEAT.NZ",
                size: 32,
                bold: true,
                color: "4A90E2",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "QUOTE",
                size: 48,
                bold: true,
                color: "333333",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // Quote Information
          new Paragraph({
            children: [
              new TextRun({
                text: `Quote Number: ${quoteData.quoteNumber}`,
                size: 20,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${formatDate(new Date())}`,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Valid Until: ${quoteData.validUntil ? formatDate(quoteData.validUntil) : '30 days from date'}`,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          // Customer and Tradesman Details Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Customer Details",
                            size: 18,
                            bold: true,
                            color: "4A90E2",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Name: ${quoteData.customerName || 'Not specified'}`,
                            size: 14,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Email: ${quoteData.customerEmail || 'Not specified'}`,
                            size: 14,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Phone: ${quoteData.customerPhone || 'Not specified'}`,
                            size: 14,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Location: ${quoteData.location || 'Auckland'}`,
                            size: 14,
                          }),
                        ],
                      }),
                    ],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    shading: {
                      fill: "F8F9FA",
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Tradesman Details",
                            size: 18,
                            bold: true,
                            color: "4A90E2",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Company: ${quoteData.tradesmanName}`,
                            size: 14,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Email: ${quoteData.tradesmanEmail}`,
                            size: 14,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Phone: ${quoteData.tradesmanPhone || 'Not specified'}`,
                            size: 14,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Service: ${quoteData.serviceType || 'Underfloor Heating'}`,
                            size: 14,
                          }),
                        ],
                      }),
                    ],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    shading: {
                      fill: "F8F9FA",
                    },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            text: "",
            spacing: { after: 600 },
          }),

          // Quote Breakdown Table
          new Paragraph({
            children: [
              new TextRun({
                text: "Quote Breakdown",
                size: 20,
                bold: true,
                color: "333333",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Item",
                            size: 14,
                            bold: true,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    width: {
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    shading: {
                      fill: "333333",
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Description",
                            size: 14,
                            bold: true,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    shading: {
                      fill: "333333",
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Amount",
                            size: 14,
                            bold: true,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    width: {
                      size: 20,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    shading: {
                      fill: "333333",
                    },
                  }),
                ],
              }),
              // Generate breakdown rows
              ...generateBreakdownRows(quoteData),
            ],
          }),

          new Paragraph({
            text: "",
            spacing: { after: 400 },
          }),

          // Total Amount
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Amount: $${quoteData.totalAmount}`,
                size: 24,
                bold: true,
                color: "155724",
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 600 },
          }),

          // Additional Notes
          ...(quoteData.additionalNotes ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Additional Notes:",
                  size: 16,
                  bold: true,
                  color: "856404",
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: quoteData.additionalNotes,
                  size: 14,
                }),
              ],
              spacing: { after: 600 },
            }),
          ] : []),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "Heat.nz",
                size: 16,
                bold: true,
                color: "4A90E2",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Professional underfloor heating solutions for your home",
                size: 12,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Thank you for choosing Heat.nz!",
                size: 12,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    // Generate document buffer
    const buffer = await Packer.toBuffer(doc);
    console.log(`✅ Word document generated successfully (${buffer.length} bytes)`);
    
    return {
      success: true,
      buffer,
      filename: `Quote_${quoteData.quoteNumber}_${formatDate(new Date())}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

  } catch (error) {
    console.error('❌ Failed to generate Word document:', error.message);
    console.error('❌ Error details:', error);
    throw error;
  }
}

// Generate breakdown table rows with mobile-friendly formatting
function generateBreakdownRows(quoteData) {
  const rows = [];
  
  // Labour breakdown
  if (quoteData.labourSubtotal && parseFloat(quoteData.labourSubtotal) > 0) {
    const labourRate = parseFloat(quoteData.labourRate) || 0;
    const labourHours = parseFloat(quoteData.labourHours) || 0;
    const labourSubtotal = parseFloat(quoteData.labourSubtotal) || 0;
    
    rows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Labour",
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `$${labourRate.toFixed(2)}/hour × ${labourHours} hours`,
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `$${labourSubtotal.toFixed(2)}`,
                  size: 14,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }));
  }
  
  // Materials breakdown
  if (quoteData.materialSubtotal && parseFloat(quoteData.materialSubtotal) > 0) {
    const materialRate = parseFloat(quoteData.materialRate) || 0;
    const materialSQM = parseFloat(quoteData.materialSQM) || 0;
    const materialSubtotal = parseFloat(quoteData.materialSubtotal) || 0;
    
    rows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Materials",
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `$${materialRate.toFixed(2)}/sqm × ${materialSQM} sqm`,
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `$${materialSubtotal.toFixed(2)}`,
                  size: 14,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }));
  }
  
  // Installation breakdown
  if (quoteData.installationSubtotal && parseFloat(quoteData.installationSubtotal) > 0) {
    const installationSubtotal = parseFloat(quoteData.installationSubtotal) || 0;
    
    rows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Installation",
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Installation services",
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `$${installationSubtotal.toFixed(2)}`,
                  size: 14,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }));
  }
  
  // If no breakdown items, add a placeholder
  if (rows.length === 0) {
    rows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Complete Service",
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Underfloor heating installation including materials and labor",
                  size: 14,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `$${quoteData.totalAmount}`,
                  size: 14,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }));
  }
  
  return rows;
}

export { generateQuoteDocument };
