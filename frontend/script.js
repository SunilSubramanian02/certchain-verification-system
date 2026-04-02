async function addCertificate() {
  try {
    const name = document.getElementById("name").value;
    const course = document.getElementById("course").value;
    const certId = document.getElementById("certId").value;

    const res = await fetch("http://localhost:5000/add-certificate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        candidateName: name,
        course: course,
        certificateId: certId
      })
    });

    const data = await res.json();

    console.log(data); // 🔥 VERY IMPORTANT

    if (data.qrCode) {
      document.getElementById("result").innerHTML = `
        <p style="color:#22c55e;">Certificate Stored on Chain ✅</p>
        <img src="${data.qrCode}" width="180" style="margin-top:10px; border-radius:10px;" />
      `;
    } else {
      document.getElementById("result").innerHTML = `
        <p style="color:red;">${data.error}</p>
      `;
    }

  } catch (err) {
    console.log(err);
    document.getElementById("result").innerHTML = `
      <p style="color:red;">Server Error ❌</p>
    `;
  }
}