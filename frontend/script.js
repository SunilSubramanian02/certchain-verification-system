const API = "https://certchain-verification-system.onrender.com";

async function addCertificate() {
  const name = document.getElementById("name").value.trim();
  const course = document.getElementById("course").value.trim();
  const certId = document.getElementById("certId").value.trim();
  const pdfFile = document.getElementById("pdfFile").files[0];
  const btn = document.getElementById("generateBtn");
  const result = document.getElementById("issueResult");

  if (!name || !course || !certId || !pdfFile) {
    result.innerHTML = `<div class="result-error"><div class="result-status"><div class="status-icon fake">✗</div><div class="status-text error">All fields + PDF required</div></div></div>`;
    return;
  }

  btn.classList.add("loading");
  btn.textContent = "Storing on chain...";

  try {
    const formData = new FormData();
    formData.append("candidateName", name);
    formData.append("course", course);
    formData.append("certificateId", certId);
    formData.append("pdf", pdfFile);

    const res = await fetch(`${API}/add-certificate`, { method: "POST", body: formData });
    const data = await res.json();

    if (data.qrCode) {
      result.innerHTML = `
        <div class="result-stored">
          <div class="result-status">
            <div class="status-icon stored">✓</div>
            <div class="status-text stored">Stored on Blockchain</div>
          </div>
          <div class="cert-grid">
            <div class="cert-row"><span class="cert-key">Name</span><span class="cert-val">${data.data.candidateName}</span></div>
            <div class="cert-row"><span class="cert-key">Course</span><span class="cert-val">${data.data.course}</span></div>
            <div class="cert-row"><span class="cert-key">Cert ID</span><span class="cert-val">${data.data.certificateId}</span></div>
          </div>
          <div class="hash-row">
            <div class="hash-label">Blockchain Hash</div>
            <div class="hash-val">${data.blockchainHash}</div>
          </div>
          <div class="qr-wrap">
            <img src="${data.qrCode}" alt="QR Code"/>
            <span class="qr-hint">⬆ Scan to verify instantly</span>
          </div>
        </div>`;
    } else {
      result.innerHTML = `<div class="result-error"><div class="result-status"><div class="status-icon fake">✗</div><div class="status-text error">${data.error || "Something went wrong"}</div></div></div>`;
    }
  } catch (err) {
    result.innerHTML = `<div class="result-error"><div class="result-status"><div class="status-icon fake">✗</div><div class="status-text error">Server not responding</div></div></div>`;
  }

  btn.classList.remove("loading");
  btn.textContent = "Generate & Store on Chain →";
}

async function verifyCertificate() {
  const pdfFile = document.getElementById("verifyPdf").files[0];
  const btn = document.getElementById("verifyBtn");
  const result = document.getElementById("verifyResult");

  if (!pdfFile) {
    result.innerHTML = `<div class="result-error"><div class="result-status"><div class="status-icon fake">✗</div><div class="status-text error">Please upload a PDF</div></div></div>`;
    return;
  }

  btn.classList.add("loading");
  btn.textContent = "Checking blockchain...";

  try {
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    const res = await fetch(`${API}/add-certificate`, { method: "POST", body: formData, signal: AbortSignal.timeout(60000) });
    const data = await res.json();

    const aiHTML = data.aiAnalysis ? `
      <div class="ai-box">
        <div class="ai-header">
          <span class="ai-icon">🤖</span>
          <span class="ai-title">AI Analysis</span>
          <span class="ai-verdict ${data.aiAnalysis.isSuspicious ? 'suspicious' : 'genuine'}">
            ${data.aiAnalysis.verdict}
          </span>
        </div>
        <div class="ai-checks">
          ${data.aiAnalysis.positive.map(p => `
            <div class="ai-check positive">✓ ${p}</div>
          `).join('')}
          ${data.aiAnalysis.suspicious.map(s => `
            <div class="ai-check suspicious">⚠ ${s}</div>
          `).join('')}
        </div>
      </div>` : '';

    if (data.blockchainVerified) {
      result.innerHTML = `
        <div class="result-valid">
          <div class="result-status">
            <div class="status-icon valid">✓</div>
            <div class="status-text valid">Certificate is VALID</div>
          </div>
          <div class="cert-grid">
            <div class="cert-row"><span class="cert-key">Name</span><span class="cert-val">${data.data.candidateName}</span></div>
            <div class="cert-row"><span class="cert-key">Course</span><span class="cert-val">${data.data.course}</span></div>
            <div class="cert-row"><span class="cert-key">Cert ID</span><span class="cert-val">${data.data.certificateId}</span></div>
          </div>
          ${aiHTML}
        </div>`;
    } else {
      result.innerHTML = `
        <div class="result-fake">
          <div class="result-status">
            <div class="status-icon fake">✗</div>
            <div class="status-text fake">Certificate is FAKE</div>
          </div>
          <p style="font-size:12px; color:var(--muted2); font-family:'Space Mono',monospace; line-height:1.6; margin-bottom:14px;">
            This PDF hash was not found on the blockchain.
          </p>
          ${aiHTML}
        </div>`;
    }
  } catch (err) {
    result.innerHTML = `<div class="result-error"><div class="result-status"><div class="status-icon fake">✗</div><div class="status-text error">Server not responding</div></div></div>`;
  }

  btn.classList.remove("loading");
  btn.textContent = "Verify Certificate →";
}

function showError(msg) {
  document.getElementById("verifyResult").innerHTML = `
    <div class="result-error">
      <div class="result-status">
        <div class="status-icon fake">✗</div>
        <div class="status-text error">${msg}</div>
      </div>
    </div>`;
}