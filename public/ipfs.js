document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const titleInput = document.getElementById('title');
    const fileInput = document.getElementById('file');
    const resultDiv = document.getElementById('result');
    const uploadBtn = document.getElementById('uploadBtn');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      resultDiv.innerHTML = "";
  
      const title = titleInput.value.trim();
      const file = fileInput.files[0];
  
      if (!title || !file) {
        resultDiv.innerHTML = "❌ Please fill in all fields.";
        return;
      }
  
      const formData = new FormData();
      formData.append('file', file);
  
      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";
  
      try {
        const res = await fetch('http://localhost:4000/upload', {
          method: 'POST',
          body: formData
        });
  
        const data = await res.json();
  
        if (!res.ok) throw new Error(data.message || "Upload failed");
  
        resultDiv.innerHTML = `
          ✅ <b>${title}</b><br/>
          🔗 <code>${data.hash}</code><br/>
          <a href="https://ipfs.io/ipfs/${data.hash}" target="_blank">View on IPFS</a>
        `;
      } catch (err) {
        resultDiv.innerHTML = `❌ Error: ${err.message}`;
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload Paper";
      }
    });
  });
  