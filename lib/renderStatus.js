// lib/renderStatus.js
export function renderStatus(stage) {
  const baseStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;";
  const checkStyle = "color: #28a745; font-weight: bold;";
  const pendingStyle = "color: #ffc107; font-weight: bold;";
  const crossStyle = "color: #dc3545; font-weight: bold;";
  
  let statusHtml = `<div style="${baseStyle}">`;
  statusHtml += `<h3 style="margin: 0 0 15px 0; color: #333;">Project Status</h3>`;
  
  switch(stage) {
    case "lead":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Quote</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
      break;
    case "quote":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
      break;
    case "accepted":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Accepted 🎉</p>`;
      break;
    case "declined":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${crossStyle}">✘</span> Quote Declined</p>`;
      break;
  }
  
  statusHtml += `</div>`;
  return statusHtml;
}
