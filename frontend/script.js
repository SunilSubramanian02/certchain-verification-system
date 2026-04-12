const API_URL = "https://certchain-verification-system.onrender.com";

async function addCertificate() {
    const name = document.getElementById("name").value.trim();
    const course = document.getElementById("course").value.trim();
    const certId = document.getElementById("certId").value.trim();
    const pdfFile = document.getElementById("pdfFile").files[0];
    const btn = document.getElementById("generateBtn");
    const result = document.getElementById("issueResult");

    if (!name || !course || !certId || !pdfFile) {
        alert("Please fill all fields");
        return;
    }

    btn.classList.add("loading");
    btn.textContent = "Processing...";

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
                <div class="result-stored">
                    <p>✅ <b>Stored on Blockchain</b></p>
                    <p>Hash: ${data.blockchainHash.substring(0,20)}...</p>
                    <img src="${data.qrCode}" width="150" />
                </div>`;
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        result.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
    } finally {
        btn.classList.remove("loading");
        btn.textContent = "Generate & Store on Chain →";
    }
}

async function verifyCertificate() {
    const pdfFile = document.getElementById("verifyPdf").files[0];
    const btn = document.getElementById("verifyBtn");
    const result = document.getElementById("verifyResult");

    if (!pdfFile) return alert("Upload PDF");

    btn.classList.add("loading");
    btn.textContent = "Verifying...";

    try {
        const formData = new FormData();
        formData.append("pdf", pdfFile);

        const res = await fetch(`${API_URL}/verify-pdf`, { method: "POST", body: formData });
        const data = await res.json();

        if (data.blockchainVerified) {
            result.innerHTML = `<div class="result-valid">✅ Certificate is VALID on Blockchain!</div>`;
        } else {
            result.innerHTML = `<div class="result-fake">❌ Certificate is FAKE / Not Found</div>`;
        }
    } catch (err) {
        result.innerHTML = `<p style="color:red">Server connection failed</p>`;
    } finally {
        btn.classList.remove("loading");
        btn.textContent = "Verify Certificate →";
    }
}