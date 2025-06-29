document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".container").classList.add("loaded");
});

const passwordInput = document.getElementById("password");
const breachToggle = document.getElementById("breach-toggle");
const strengthBarFill = document.getElementById("strength-bar-fill");
const strengthText = document.getElementById("strength-text");
const tipsList = document.getElementById("tips");

passwordInput.addEventListener("input", async () => {
  const password = passwordInput.value;
  const result = checkStrength(password);
  updateUI(result);

  // Check HIBP only if toggle is ON
  if (breachToggle.checked && password.length > 0) {
    const breached = await checkPwned(password);
    showBreachMessage(breached);
  } else {
    clearBreachMessage();
  }
});

function checkStrength(password) {
  let score = 0;
  const tips = [];

  if (password.length >= 12) score += 1;
  else tips.push("Make it at least 12 characters.");

  if (/[A-Z]/.test(password)) score += 1;
  else tips.push("Add uppercase letters.");

  if (/[a-z]/.test(password)) score += 1;
  else tips.push("Add lowercase letters.");

  if (/[0-9]/.test(password)) score += 1;
  else tips.push("Add numbers.");

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else tips.push("Add symbols like !@#$.");

  const entropy = calculateEntropy(password);

  let strength = "Weak";
  let color = "red";

  if (entropy > 80) {
    strength = "Very Strong";
    color = "purple";
  } else if (entropy > 60) {
    strength = "Strong";
    color = "green";
  } else if (entropy > 40) {
    strength = "Medium";
    color = "orange";
  }

  return { score, strength, color, entropy, tips };
}

function calculateEntropy(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32;

  return password.length * Math.log2(charsetSize || 1);
}

function updateUI(result) {
  strengthBarFill.style.width = `${result.score * 20}%`;
  strengthBarFill.style.background = result.color;

  strengthText.textContent = `Strength: ${result.strength} (${Math.round(
    result.entropy
  )} bits entropy)`;

  strengthText.classList.add("pop");
  setTimeout(() => {
    strengthText.classList.remove("pop");
  }, 300);

  tipsList.innerHTML = "";
  result.tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    tipsList.appendChild(li);
  });
}

async function checkPwned(password) {
  const sha1 = await sha1Hash(password);
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5).toUpperCase();

  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`
  );
  const text = await response.text();

  return text.includes(suffix);
}

async function sha1Hash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const buffer = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function showBreachMessage(breached) {
  let breachElement = document.getElementById("breach-message");
  if (!breachElement) {
    breachElement = document.createElement("p");
    breachElement.id = "breach-message";
    document.querySelector(".container").appendChild(breachElement);
  }
  if (breached) {
    breachElement.textContent = "⚠️ This password has been found in data breaches. Avoid using it!";
    breachElement.style.color = "red";
  } else {
    breachElement.textContent = "✅ Good news! This password was not found in known breaches.";
    breachElement.style.color = "green";
  }
}

function clearBreachMessage() {
  const breachElement = document.getElementById("breach-message");
  if (breachElement) {
    breachElement.textContent = "";
  }
}
