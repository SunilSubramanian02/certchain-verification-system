const API = "http://localhost:5000";

async function addCertificate() {
  const name = document.getElementById("name").value.trim();
  const course = document.getElementById("course").value.trim();
  const certId = document.getElementById("certId").value.trim();
  const pdfFile = document.getElementById("pdfFile").files[0];
  const btn = document.getElementById("generateBtn");
  const result = document.getElementById("issueResult");

  if (!name || !course || !certId || !pdfFile) {
    showError(result, "All fields + PDF required");
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
          <p class="status-text stored">✓ Stored on Blockchain</p>
          <div class="cert-row"><span class="cert-key">Name</span><span>${data.data.candidateName}</span></div>
          <div class="cert-row"><span class="cert-key">Cert ID</span><span>${data.data.certificateId}</span></div>
          <div class="qr-wrap">
            <img src="${data.qrCode}" alt="QR"/>
            <p class="cert-key">Scan to verify</p>
          </div>
        </div>`;
    } else {
      showError(result, data.error || "Execution failed");
    }
  } catch (err) {
    showError(result, "Server connection failed");
  } finally {
    btn.classList.remove("loading");
    btn.textContent = "Generate & Store on Chain →";
  }
}

async function verifyCertificate() {
  const pdfFile = document.getElementById("verifyPdf").files[0];
  const btn = document.getElementById("verifyBtn");
  const result = document.getElementById("verifyResult");

  if (!pdfFile) {
    showError(result, "Please upload a PDF");
    return;
  }

  btn.classList.add("loading");
  btn.textContent = "Checking blockchain...";

  try {
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    const res = await fetch(`${API}/verify-pdf`, { method: "POST", body: formData });
    const data = await res.json();

    if (data.blockchainVerified) {
      result.innerHTML = `
        <div class="result-valid">
          <p class="status-text valid">✓ Certificate is VALID</p>
          <div class="cert-row"><span>Name</span><span>${data.data.candidateName}</span></div>
        </div>`;
    } else {
      result.innerHTML = `
        <div class="result-fake">
          <p class="status-text fake">✗ Certificate is FAKE</p>
          <p class="cert-key">Hash not found on chain.</p>
        </div>`;
    }
  } catch (err) {
    showError(result, "Server error");
  } finally {
    btn.classList.remove("loading");
    btn.textContent = "Verify Certificate →";
  }
}

function showError(container, msg) {
  container.innerHTML = `<div class="result-error"><p class="status-text fake">✗ ${msg}</p></div>`;
}