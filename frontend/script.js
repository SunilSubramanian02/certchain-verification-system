const API_URL = "https://certchain-verification-system.onrender.com";

async function addCertificate() {
    const name = document.getElementById("name").value.trim();
    const course = document.getElementById("course").value.trim();
    const certId = document.getElementById("certId").value.trim();
    const pdfFile = document.getElementById("pdfFile").files[0];
    const btn = document.getElementById("generateBtn");
    const result = document.getElementById("issueResult");

    if (!name || !course || !certId || !pdfFile) {
        alert("Please fill all fields and upload PDF");
        return;
    }

    btn.classList.add("loading");
    btn.textContent = "Storing on Chain...";

    try {
        const formData = new FormData();
        formData.append("candidateName", name);
        formData.append("course", course);
        formData.append("certificateId", certId);
        formData.append("pdf", pdfFile);

        const res = await fetch(`${API_URL}/add-certificate`, { method: "POST", body: formData });
        const data = await res.json();

        if (data.qrCode) {
            result.innerHTML = `
                <div class="result-stored" style="color: #00ffcc; margin-top: 15px;">
                    <p>✅ <b>Success! Stored on Blockchain</b></p>
                    <p style="font-size: 10px;">Hash: ${data.blockchainHash}</p>
                    <img src="${data.qrCode}" width="150" style="border: 5px solid white; margin-top: 10px;"/>
                </div>`;
        } else {
            throw new Error(data.error || "Failed to store");
        }
    } catch (err) {
        result.innerHTML = `<p style="color: #ff4d4d; margin-top: 15px;">❌ Error: ${err.message}</p>`;
    } finally {
        btn.classList.remove("loading");
        btn.textContent = "Generate & Store on Chain →";
    }
}

async function verifyCertificate() {
    const pdfFile = document.getElementById("verifyPdf").files[0];
    const btn = document.getElementById("verifyBtn");
    const result = document.getElementById("verifyResult");

    if (!pdfFile) return alert("Please select a PDF to verify");

    btn.classList.add("loading");
    btn.textContent = "Verifying on Chain...";

    try {
        const formData = new FormData();
        formData.append("pdf", pdfFile);

        const res = await fetch(`${API_URL}/verify-pdf`, { method: "POST", body: formData });
        const data = await res.json();

        if (data.blockchainVerified) {
            result.innerHTML = `<div class="result-valid" style="color: #00ffcc;">✅ VALID: This certificate exists on Blockchain!</div>`;
        } else {
            result.innerHTML = `<div class="result-fake" style="color: #ff4d4d;">❌ FAKE: Certificate not found on Blockchain.</div>`;
        }
    } catch (err) {
        result.innerHTML = `<p style="color: #ff4d4d;">❌ Connection Error</p>`;
    } finally {
        btn.classList.remove("loading");
        btn.textContent = "Verify Certificate →";
    }
}

// CRITICAL: Linking functions to buttons
document.getElementById("generateBtn").addEventListener("click", addCertificate);
document.getElementById("verifyBtn").addEventListener("click", verifyCertificate);