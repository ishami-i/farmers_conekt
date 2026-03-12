
  // ─────────────────────────────────────
  // DATABASE 
  // ─────────────────────────────────────
  var DB = {
    farmers: [],  // each farmer: { id, first, last, email, phone, farm, type, password, joinDate }
    buyers:  [],  // each buyer:  { id, first, last, email, phone, password, joinDate }
    crops:   [],  // each crop:   { id, farmerId, farmerName, farmName, name, qty, price }
    orders:  []   // each order:  { id, buyerId, buyerName, farmerId, cropName, farmerName, qty, total, date }
  };

  var currentUser = null;   // the logged-in user object
  var currentRole = null;   // 'farmer' or 'buyer'
  var orderCounter = 1000;  // gives each order a unique number

  // Which method is selected on the login / signup forms
  var loginMethod  = { farmer: 'email', buyer: 'email' };
  var signupMethod = { farmer: 'email', buyer: 'email' };


  // ─────────────────────────────────────
  // SMALL HELPER FUNCTIONS
  // ─────────────────────────────────────

  // Make a short unique ID
  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Format a number as a dollar amount, e.g. 7.5 → "$7.50"
  function money(n) {
    return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Today's date as a readable string, e.g. "Jun 12, 2025"
  function today() {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Escape special characters so text is safe to put inside HTML
  function safe(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Show a small popup message at the bottom of the screen
  function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + (type || '');
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3200);
  }

  // Show one screen and hide all others
  function goTo(screenId) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
  }

  // Go to farmer or buyer auth screen
  function goToAuth(role) {
    goTo(role === 'farmer' ? 'screen-farmer-auth' : 'screen-buyer-auth');
  }

  // Switch between Sign In / Create Account tabs inside the auth card
  function switchTab(clickedBtn, panelId) {
    clickedBtn.parentElement.querySelectorAll('.tab').forEach(function (t) {
      t.classList.remove('active');
    });
    clickedBtn.classList.add('active');

    clickedBtn.closest('.card').querySelectorAll('.panel').forEach(function (p) {
      p.classList.remove('active');
    });
    document.getElementById(panelId).classList.add('active');
  }

  // Switch between dashboard tabs (Overview, My Crops, etc.)
  function switchDashTab(clickedBtn, panelId) {
    clickedBtn.parentElement.querySelectorAll('.dash-tab').forEach(function (t) {
      t.classList.remove('active');
    });
    clickedBtn.classList.add('active');

    clickedBtn.closest('.dashboard').querySelectorAll('.dash-panel').forEach(function (p) {
      p.classList.remove('active');
    });
    document.getElementById(panelId).classList.add('active');
  }

  // Show a loading spinner on a button, then run a function after a short delay
  function withLoading(btnId, callback) {
    var btn = document.getElementById(btnId);
    btn.classList.add('loading');
    btn.disabled = true;
    setTimeout(function () {
      btn.classList.remove('loading');
      btn.disabled = false;
      callback();
    }, 1300);
  }


  // ─────────────────────────────────────
  // EYE BUTTON — show / hide passwords
  // ─────────────────────────────────────
  document.querySelectorAll('.toggle-pw').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.dataset.target);
      var icon  = btn.querySelector('use');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('href', '#ico-eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('href', '#ico-eye');
      }
    });
  });


  // ─────────────────────────────────────
  // PASSWORD STRENGTH METER
  // ─────────────────────────────────────
  function watchPasswordStrength(inputId, fillId, labelId, wrapId) {
    document.getElementById(inputId).addEventListener('input', function () {
      var password = this.value;
      var wrap     = document.getElementById(wrapId);

      if (!password) { wrap.style.display = 'none'; return; }
      wrap.style.display = 'block';

      // Score increases for each rule the password passes
      var score = 0;
      if (password.length >= 8)          score++;
      if (/[A-Z]/.test(password))        score++;
      if (/[0-9]/.test(password))        score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      var levels = [
        { width: '20%',  color: '#c0392b', label: 'Weak'   },
        { width: '45%',  color: '#e67e22', label: 'Fair'   },
        { width: '72%',  color: '#f1c40f', label: 'Good'   },
        { width: '100%', color: '#27ae60', label: 'Strong' }
      ];

      var level = levels[Math.max(0, score - 1)];
      var fill  = document.getElementById(fillId);
      var lbl   = document.getElementById(labelId);

      fill.style.width      = level.width;
      fill.style.background = level.color;
      lbl.textContent       = level.label;
      lbl.style.color       = level.color;
    });
  }

  watchPasswordStrength('fs-pass', 'fs-sf', 'fs-sl', 'fs-sw');
  watchPasswordStrength('bs-pass', 'bs-sf', 'bs-sl', 'bs-sw');


  // ─────────────────────────────────────
  // EMAIL / PHONE TOGGLE ON LOGIN FORMS
  // ─────────────────────────────────────
  function setLoginMethod(role, method, clickedBtn) {
    loginMethod[role] = method;

    clickedBtn.parentElement.querySelectorAll('.method-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    clickedBtn.classList.add('active');

    var prefix = role === 'farmer' ? 'fl' : 'bl';
    document.getElementById(prefix + '-email-grp').style.display = method === 'email' ? 'block' : 'none';
    document.getElementById(prefix + '-phone-grp').style.display = method === 'phone' ? 'block' : 'none';
  }

  // EMAIL / PHONE TOGGLE ON SIGN-UP FORMS
  function setSignupContact(role, method, clickedBtn) {
    signupMethod[role] = method;

    clickedBtn.parentElement.querySelectorAll('.method-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    clickedBtn.classList.add('active');

    var p = role === 'farmer' ? 'fs' : 'bs';
    // Show the chosen login-identity field
    document.getElementById(p + '-email-grp').style.display   = method === 'email' ? 'block' : 'none';
    document.getElementById(p + '-phone-grp').style.display   = method === 'phone' ? 'block' : 'none';
    // Show the extra "other contact" field below it
    document.getElementById(p + '-extra-phone').style.display = method === 'email' ? 'block' : 'none';
    document.getElementById(p + '-extra-email').style.display = method === 'phone' ? 'block' : 'none';
  }


  // ─────────────────────────────────────
  // SIGN UP
  // ─────────────────────────────────────
  function doSignup(role) {

    if (role === 'farmer') {

      var first   = document.getElementById('fs-first').value.trim();
      var last    = document.getElementById('fs-last').value.trim();
      var farm    = document.getElementById('fs-farm').value.trim();
      var type    = document.getElementById('fs-type').value;
      var pass    = document.getElementById('fs-pass').value;
      var confirm = document.getElementById('fs-confirm').value;

      // Pick email or phone as the login credential depending on which toggle is active
      var method = signupMethod.farmer;
      var email  = method === 'email'
        ? document.getElementById('fs-email').value.trim()
        : document.getElementById('fs-email-extra').value.trim();
      var phone  = method === 'phone'
        ? document.getElementById('fs-phone-c').value.trim()
        : document.getElementById('fs-phone').value.trim();

      // Validation checks
      if (!first || !last || !farm || !type || !pass || !confirm) {
        showToast('Please fill in all fields.', 'error'); return;
      }
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        showToast('Enter a valid email address.', 'error'); return;
      }
      if (!email && !phone) {
        showToast('Please provide an email or phone number.', 'error'); return;
      }
      if (pass.length < 6) {
        showToast('Password must be at least 6 characters.', 'error'); return;
      }
      if (pass !== confirm) {
        showToast('Passwords do not match.', 'error'); return;
      }

      // Check if this email or phone is already registered
      var duplicate = DB.farmers.some(function (f) {
        return (email && f.email === email) || (phone && f.phone === phone);
      });
      if (duplicate) {
        showToast('An account with that email or phone already exists.', 'error'); return;
      }

      withLoading('fs-btn', function () {
        var newFarmer = {
          id: makeId(), first: first, last: last,
          email: email, phone: phone, farm: farm,
          type: type, password: pass, joinDate: today()
        };
        DB.farmers.push(newFarmer);
        currentUser = newFarmer;
        currentRole = 'farmer';
        loadFarmerDash();
        goTo('screen-farmer-dash');
        showToast('Welcome to FARMER CONEKT, ' + first + '!', 'success');
      });

    } else {

      var first   = document.getElementById('bs-first').value.trim();
      var last    = document.getElementById('bs-last').value.trim();
      var pass    = document.getElementById('bs-pass').value;
      var confirm = document.getElementById('bs-confirm').value;

      var method = signupMethod.buyer;
      var email  = method === 'email'
        ? document.getElementById('bs-email').value.trim()
        : document.getElementById('bs-email-extra').value.trim();
      var phone  = method === 'phone'
        ? document.getElementById('bs-phone-c').value.trim()
        : document.getElementById('bs-phone').value.trim();

      if (!first || !last || !pass || !confirm) {
        showToast('Please fill in all fields.', 'error'); return;
      }
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        showToast('Enter a valid email address.', 'error'); return;
      }
      if (!email && !phone) {
        showToast('Please provide an email or phone number.', 'error'); return;
      }
      if (pass.length < 6) {
        showToast('Password must be at least 6 characters.', 'error'); return;
      }
      if (pass !== confirm) {
        showToast('Passwords do not match.', 'error'); return;
      }

      var duplicate = DB.buyers.some(function (b) {
        return (email && b.email === email) || (phone && b.phone === phone);
      });
      if (duplicate) {
        showToast('An account with that email or phone already exists.', 'error'); return;
      }

      withLoading('bs-btn', function () {
        var newBuyer = {
          id: makeId(), first: first, last: last,
          email: email, phone: phone,
          password: pass, joinDate: today()
        };
        DB.buyers.push(newBuyer);
        currentUser = newBuyer;
        currentRole = 'buyer';
        loadBuyerDash();
        goTo('screen-buyer-dash');
        showToast('Welcome to FARMER CONEKT, ' + first + '!', 'success');
      });
    }
  }


  // ─────────────────────────────────────
  // LOGIN — looks up user in the database
  // ─────────────────────────────────────
  function doLogin(role) {
    var method = loginMethod[role];

    if (role === 'farmer') {
      var credential = method === 'email'
        ? document.getElementById('fl-email').value.trim()
        : document.getElementById('fl-phone').value.trim();
      var password = document.getElementById('fl-pass').value;

      if (!credential || !password) { showToast('Please fill in all fields.', 'error'); return; }

      var match = DB.farmers.find(function (f) {
        return (method === 'email' ? f.email === credential : f.phone === credential)
          && f.password === password;
      });

      if (!match) { showToast('Incorrect email/phone or password.', 'error'); return; }

      withLoading('fl-btn', function () {
        currentUser = match;
        currentRole = 'farmer';
        loadFarmerDash();
        goTo('screen-farmer-dash');
        showToast('Welcome back, ' + match.first + '!', 'success');
      });

    } else {
      var credential = method === 'email'
        ? document.getElementById('bl-email').value.trim()
        : document.getElementById('bl-phone').value.trim();
      var password = document.getElementById('bl-pass').value;

      if (!credential || !password) { showToast('Please fill in all fields.', 'error'); return; }

      var match = DB.buyers.find(function (b) {
        return (method === 'email' ? b.email === credential : b.phone === credential)
          && b.password === password;
      });

      if (!match) { showToast('Incorrect email/phone or password.', 'error'); return; }

      withLoading('bl-btn', function () {
        currentUser = match;
        currentRole = 'buyer';
        loadBuyerDash();
        goTo('screen-buyer-dash');
        showToast('Welcome back, ' + match.first + '!', 'success');
      });
    }
  }


  // ─────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────
  function doLogout() {
    currentUser = null;
    currentRole = null;
    goTo('screen-role');
    showToast('You have been logged out.', '');
  }


  // ─────────────────────────────────────
  // FARMER DASHBOARD
  // ─────────────────────────────────────

  // Called once after login — fills in the farmer's name, profile, etc.
  function loadFarmerDash() {
    var u = currentUser;

    document.getElementById('f-avatar').textContent  = u.first.charAt(0).toUpperCase();
    document.getElementById('f-welcome').textContent = 'Welcome, ' + u.first;
    document.getElementById('f-p-name').textContent  = u.first + ' ' + u.last;
    document.getElementById('f-p-email').textContent = u.email  || '—';
    document.getElementById('f-p-phone').textContent = u.phone  || '—';
    document.getElementById('f-p-type').textContent  = u.type;
    document.getElementById('f-p-farm').textContent  = u.farm;
    document.getElementById('f-p-since').textContent = u.joinDate;

    // Close the add-crop form and jump to the Overview tab
    document.getElementById('add-crop-form').classList.remove('open');
    var firstTab = document.querySelector('#screen-farmer-dash .dash-tab');
    if (firstTab) switchDashTab(firstTab, 'fd-overview');

    refreshFarmerDash();
  }

  // Rebuilds all tables and numbers on the farmer dashboard using live DB data
  function refreshFarmerDash() {
    if (!currentUser || currentRole !== 'farmer') return;

    var myId     = currentUser.id;
    var myCrops  = DB.crops.filter(function (c) { return c.farmerId === myId; });
    var myOrders = DB.orders.filter(function (o) { return o.farmerId === myId; });
    var revenue  = myOrders.reduce(function (sum, o) { return sum + o.total; }, 0);

    // Update the three stat cards
    document.getElementById('f-stat-crops').textContent   = myCrops.length;
    document.getElementById('f-stat-orders').textContent  = myOrders.length;
    document.getElementById('f-stat-revenue').textContent = money(revenue);

    // Overview: show the 5 most recent orders
    var recentOrders = myOrders.slice(-5).reverse();
    document.getElementById('f-ov-orders').innerHTML =
      recentOrders.length === 0
        ? '<tr class="empty-row"><td colspan="5">No orders yet.</td></tr>'
        : recentOrders.map(function (o) {
            return '<tr><td>' + safe(o.buyerName) + '</td><td>' + safe(o.cropName) + '</td>'
              + '<td>' + o.qty + ' kg</td><td>' + money(o.total) + '</td>'
              + '<td><span class="badge green">Received</span></td></tr>';
          }).join('');

    // My Crops table
    document.getElementById('f-crops-tbody').innerHTML =
      myCrops.length === 0
        ? '<tr class="empty-row"><td colspan="4">No crops yet. Click "+ Add Crop".</td></tr>'
        : myCrops.map(function (c) {
            return '<tr><td>' + safe(c.name) + '</td><td>' + c.qty + ' kg</td>'
              + '<td>' + money(c.price) + '</td>'
              + '<td><button class="btn-tbl" onclick="deleteCrop(\'' + c.id + '\')">Remove</button></td></tr>';
          }).join('');

    // Orders Received table (newest first)
    document.getElementById('f-orders-tbody').innerHTML =
      myOrders.length === 0
        ? '<tr class="empty-row"><td colspan="6">No orders received yet.</td></tr>'
        : myOrders.slice().reverse().map(function (o) {
            return '<tr><td>#' + o.id + '</td><td>' + safe(o.buyerName) + '</td>'
              + '<td>' + safe(o.cropName) + '</td><td>' + o.qty + ' kg</td>'
              + '<td>' + money(o.total) + '</td><td>' + o.date + '</td></tr>';
          }).join('');

    // Revenue stats
    var count = myOrders.length;
    document.getElementById('f-rev-total').textContent = money(revenue);
    document.getElementById('f-rev-count').textContent = count;
    document.getElementById('f-rev-avg').textContent   = money(count > 0 ? revenue / count : 0);

    // Revenue broken down by crop name
    var byCrop = {};
    myOrders.forEach(function (o) {
      if (!byCrop[o.cropName]) byCrop[o.cropName] = { qty: 0, total: 0 };
      byCrop[o.cropName].qty   += o.qty;
      byCrop[o.cropName].total += o.total;
    });

    var cropNames = Object.keys(byCrop);
    document.getElementById('f-rev-tbody').innerHTML =
      cropNames.length === 0
        ? '<tr class="empty-row"><td colspan="3">No revenue data yet.</td></tr>'
        : cropNames.map(function (name) {
            return '<tr><td>' + safe(name) + '</td><td>' + byCrop[name].qty + ' kg</td>'
              + '<td>' + money(byCrop[name].total) + '</td></tr>';
          }).join('');
  }


  // ─────────────────────────────────────
  // ADD / REMOVE CROPS
  // ─────────────────────────────────────

  function toggleCropForm() {
    document.getElementById('add-crop-form').classList.toggle('open');
  }

  function addCrop() {
    var name  = document.getElementById('nc-name').value.trim();
    var qty   = parseFloat(document.getElementById('nc-qty').value);
    var price = parseFloat(document.getElementById('nc-price').value);

    if (!name)           { showToast('Please enter a crop name.', 'error'); return; }
    if (!qty  || qty  < 1) { showToast('Please enter a valid quantity.', 'error'); return; }
    if (!price || price <= 0) { showToast('Please enter a valid price.', 'error'); return; }

    DB.crops.push({
      id:         makeId(),
      farmerId:   currentUser.id,
      farmerName: currentUser.first + ' ' + currentUser.last,
      farmName:   currentUser.farm,
      name:       name,
      qty:        qty,
      price:      price
    });

    // Clear the form inputs
    document.getElementById('nc-name').value  = '';
    document.getElementById('nc-qty').value   = '';
    document.getElementById('nc-price').value = '';
    document.getElementById('add-crop-form').classList.remove('open');

    // Refresh both dashboards so the crop appears immediately
    refreshFarmerDash();
    refreshBuyerCrops();
    refreshSavedFarmers();

    showToast(name + ' added to listings!', 'success');
  }

  function deleteCrop(cropId) {
    DB.crops = DB.crops.filter(function (c) { return c.id !== cropId; });
    refreshFarmerDash();
    refreshBuyerCrops();
    refreshSavedFarmers();
    showToast('Crop removed.', '');
  }




  function loadBuyerDash() {
    var u = currentUser;

    document.getElementById('b-avatar').textContent  = u.first.charAt(0).toUpperCase();
    document.getElementById('b-welcome').textContent = 'Welcome, ' + u.first;
    document.getElementById('b-p-name').textContent  = u.first + ' ' + u.last;
    document.getElementById('b-p-email').textContent = u.email || '—';
    document.getElementById('b-p-phone').textContent = u.phone || '—';
    document.getElementById('b-p-since').textContent = u.joinDate;

    var firstTab = document.querySelector('#screen-buyer-dash .dash-tab');
    if (firstTab) switchDashTab(firstTab, 'bd-browse');

    refreshBuyerCrops();
    refreshBuyerOrders();
    refreshSavedFarmers();
  }

  // Rebuild the crop cards grid from whatever is in DB.crops
  function refreshBuyerCrops() {
    var grid = document.getElementById('b-crop-grid');
    if (!grid) return;

    if (DB.crops.length === 0) {
      grid.innerHTML = '<p class="no-crops">No crops listed yet — check back soon!</p>';
      return;
    }

    grid.innerHTML = DB.crops.map(function (c) {
      return '<div class="crop-card">'
        + '<div class="crop-name">'  + safe(c.name)    + '</div>'
        + '<div class="crop-farm">'  + safe(c.farmName) + '</div>'
        + '<div class="crop-stock">' + c.qty + ' kg available</div>'
        + '<div class="crop-price">' + money(c.price) + ' <span class="crop-unit">/ kg</span></div>'
        + '<button class="btn-order" onclick="placeOrder(\'' + c.id + '\')">Order Now</button>'
        + '</div>';
    }).join('');
  }

  // Called when a buyer clicks "Order Now"
  function placeOrder(cropId) {
    var crop = DB.crops.find(function (c) { return c.id === cropId; });
    if (!crop) { showToast('This crop is no longer available.', 'error'); return; }

    orderCounter++;
    var qty = 50; // default order quantity in kg

    DB.orders.push({
      id:          orderCounter,
      buyerId:     currentUser.id,
      buyerName:   currentUser.first + ' ' + currentUser.last,
      farmerId:    crop.farmerId,
      cropId:      crop.id,
      cropName:    crop.name,
      farmerName:  crop.farmName,
      qty:         qty,
      total:       qty * crop.price,
      date:        today()
    });

    // Refresh both dashboards so the order appears immediately
    refreshBuyerOrders();
    refreshFarmerDash();

    showToast('Order #' + orderCounter + ' placed for ' + crop.name + '!', 'success');

    // Jump to My Orders tab so the buyer can see it right away
    var ordersTab = document.querySelector('#screen-buyer-dash .dash-nav .dash-tab:nth-child(2)');
    if (ordersTab) switchDashTab(ordersTab, 'bd-orders');
  }

  // Rebuild the My Orders table for the current buyer
  function refreshBuyerOrders() {
    if (!currentUser || currentRole !== 'buyer') return;

    var myOrders = DB.orders.filter(function (o) { return o.buyerId === currentUser.id; });

    document.getElementById('b-orders-tbody').innerHTML =
      myOrders.length === 0
        ? '<tr class="empty-row"><td colspan="7">No orders yet — browse crops and place your first order!</td></tr>'
        : myOrders.slice().reverse().map(function (o) {
            return '<tr>'
              + '<td>#' + o.id + '</td>'
              + '<td>' + safe(o.cropName)   + '</td>'
              + '<td>' + safe(o.farmerName) + '</td>'
              + '<td>' + o.qty + ' kg</td>'
              + '<td>' + money(o.total) + '</td>'
              + '<td>' + o.date + '</td>'
              + '<td><button class="btn-tbl" onclick="removeOrder(' + o.id + ')">Remove</button></td>'
              + '</tr>';
          }).join('');
  }

  // Remove an order from the buyer's list (and from the farmer's view too)
  function removeOrder(orderId) {
    DB.orders = DB.orders.filter(function (o) { return o.id !== orderId; });
    refreshBuyerOrders();
    refreshFarmerDash();
    showToast('Order removed.', '');
  }

  // Show farmers who have active crop listings
  function refreshSavedFarmers() {
    var grid = document.getElementById('b-saved-grid');
    if (!grid) return;

    // Collect one entry per unique farmer who has a crop in DB.crops
    var seen     = {};
    var farmers  = [];
    DB.crops.forEach(function (c) {
      if (!seen[c.farmerId]) {
        seen[c.farmerId] = true;
        farmers.push({ name: c.farmerName, farm: c.farmName });
      }
    });

    grid.innerHTML =
      farmers.length === 0
        ? '<p class="no-crops" style="width:100%">No active farmer listings yet.</p>'
        : farmers.map(function (f) {
            return '<div class="saved-card">'
              + '<div class="saved-avatar">' + safe(f.name.charAt(0).toUpperCase()) + '</div>'
              + '<h4>' + safe(f.farm) + '</h4>'
              + '<p>'  + safe(f.name) + '</p>'
              + '</div>';
          }).join('');
  }

