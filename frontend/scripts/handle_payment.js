async function handlePaymentSubmit(event) {
    event.preventDefault();
  
    const email = document.getElementById("payment-email").value;
    const name = document.getElementById("full-name").value || "Customer";
    const amount = parseInt(
      document.getElementById("modal-total-amount").innerText.replace(" RWF", "")
    );
  
    const phone = prompt("Enter your Mobile Money number (07XXXXXXXX):");
  
    const res = await fetch("http://localhost:5000/api/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        name,
        phone,
        amount
      })
    });
  
    const data = await res.json();
  
    alert("Payment request sent. Check your phone.");
    console.log(data);
  }