var amount, reserveAmount, userRef, reservedDate = new Date();
var referenceId = 'ReferenceId-TechHubEKSU'+Math.floor((Math.random() * 100000) + 1);

function companySelect() {
  var once = document.getElementById("companyBox");

  if (document.forms[0].company.options[document.forms[0].company.selectedIndex].value === "others") {
    once.style.display = "block";
  }
  else {
    once.style.display = "none";
  }
}

function planSelect() {
  var once = document.getElementById("onceBox");

  if (document.forms[0].plan.options[document.forms[0].plan.selectedIndex].value === "once") {
    once.style.display = "block";
  }
  else {
    once.style.display = "none";
  }
}

$("#reserveForm").validator().on("submit", function (event) {
  if (event.isDefaultPrevented()) {
    $("#confirmation").hide();
    formError();
    submitMSG(false, "Did you fill in the form properly?");
  } else {
    event.preventDefault();
    submitForm();
  }
});

$('#confirmBtn').click(function(){
  $("#confirmation").show();

  var name = ($("#name").val());
  var phone = ($("#phone").val());
  var email = ($("#email").val());
  var company = ($("#company").val());
  var otherCompany = ($("#otherCompany").val());
  var plan = ($("#plan").val());
  var date = ($("#date").val());
  var hours = ($("#hours").val());

  document.getElementById("confirm-name").innerHTML = name;
  document.getElementById("confirm-phone").innerHTML = phone;
  document.getElementById("confirm-email").innerHTML = email;

  if (company === 'none') {
    $("#confirmation").hide();

    formError();
    submitMSG(false, 'Please Select A Company')
  } else if (company === 'others') {
    document.getElementById("confirm-company").innerHTML = otherCompany;
  } else {
    document.getElementById("confirm-company").innerHTML = company;
  }

  if (!(company == 'none' | company == 'others') & plan == 'once' &  hours > 0) {
    amount = 1000 * hours;
    reserveAmount = 0.5 * amount;
  } else if (company == 'others' & plan == 'once' & hours > 0) {
    amount = 1500 * hours;
    reserveAmount = 0.5 * amount;
  }

  if (plan === 'none') {
    $("#confirmation").hide();

    formError();
    submitMSG(false, 'Please Select A Plan')
  } else if (plan === 'others') {
    var message = 'Kindly contact TechHub EKSU team to explain your reservation better. <strong>Note,</strong> keep your Reference Number well for your reservation status';

    document.getElementById("confirm-plan").innerHTML = 'Others (More Than A Day)';
    document.getElementById("confirm-message").innerHTML = message;
    document.getElementById("button-text").innerHTML = '<i class="fa fa-lock"></i> Complete Reservation';
  } else {
    var message = '<strong>Date:</strong> ' + date + ', <strong>Hours:</strong> ' + hours + ', <strong>Total Amount:</strong> ₦' + amount + '.00K, <strong>Reserved Amount:</strong> ₦' + reserveAmount + '.00K';

    document.getElementById("confirm-plan").innerHTML = 'A Day';
    document.getElementById("confirm-message").innerHTML = message;
    document.getElementById("button-text").innerHTML = '<i class="fa fa-lock"></i> Pay With PayStack';
  }
});

function submitForm(){
  $("#confirmation").hide();

  var name = ($("#name").val());
  var phone = ($("#phone").val());
  var email = ($("#email").val());
  var inputCompany = ($("#company").val());
  var otherCompany = ($("#otherCompany").val());
  var plan = ($("#plan").val());
  var date = ($("#date").val());
  var hours = ($("#hours").val());

  var db = firebase.firestore(), company;

  if (inputCompany === 'none') {
    $("#confirmation").hide();

    formError();
    submitMSG(false, 'Please Select A Company')
  } else if (inputCompany === 'others') {
    company = otherCompany;
  } else {
    company = inputCompany;
  }

  if (!(inputCompany == 'none' | inputCompany == 'others') & plan == 'once' &  hours > 0) {
    amount = 1000 * hours;
    reserveAmount = 0.5 * amount;
  } else if (inputCompany == 'others' & plan == 'once' & hours > 0) {
    amount = 1500 * hours;
    reserveAmount = 0.5 * amount;
  }

  var balanceAmount = amount - reserveAmount;

  if (plan === 'none') {
    $("#confirmation").hide();

    formError();
    submitMSG(false, 'Please Select A Plan')
  } else if (plan === 'others') {
    db.collection("Reservation").doc(referenceId).set({
      referenceId: referenceId,
      status: 'unpaid',
      reservedDate: firebase.firestore.Timestamp.fromDate(reservedDate),
      name: name,
      email: email,
      phone: phone,
      company: company,
      plan: 'Others (More Than A Day)',
      date: '',
      hours: 0,
      totalAmount: 0,
      reserveAmount: 0,
      balance: 0,
    })
    .catch(function(error) {
      formError();
      submitMSG(false, error)
    })
    .then(function() {
      formSuccess();
      var message = 'Your reservation has being completed. Your Reference Number is ' + referenceId;
      submitMSG(true, message);
    })
  } else {
    db.collection("Settings").doc("PayStack").get().then(function(doc) {
      if (doc.exists) {
        const payStackKey = doc.data().transactionKey;

        var handler = PaystackPop.setup({
          key: payStackKey,
          email: email,
          amount: reserveAmount * 100,
          currency: 'NGN',
          ref: 'Reserve-TechHubEKSU'+Math.floor((Math.random() * 1000000000) + 1),
          metadata: {
            custom_fields: [
              {
                display_name: "Company",
                variable_name: "company",
                value: company
              }
            ]
          },
          callback: function(response){
            userRef = response.reference;
            firebase();
          },
          onClose: function(){
            formError();
            submitMSG(false,"Window Closed");
            stop();
          }
        });
        handler.openIframe();

        function firebase() {
          db.collection("Reservation").doc(referenceId).set({
            referenceId: referenceId,
            status: 'reserved',
            reservedDate: firebase.firestore.Timestamp.fromDate(reservedDate),
            name: name,
            email: email,
            phone: phone,
            company: company,
            plan: 'A Day',
            date: date,
            hours: hours,
            totalAmount: amount,
            reserveAmount: reserveAmount,
            balance: balanceAmount,
          })
          .catch(function(error) {
            formError();
            submitMSG(false,error);
          })
          .then(function() {
            db.collection("Reservation-Payment").doc(userRef).set({
              referenceId: referenceId,
              transactionRef: userRef,
              date: reservedDate,
            })
            .catch(function(error) {
              formError();
              submitMSG(false,error);
            })
            .then(function() {
              formSuccess();
              var message = 'Transaction successful. Your reservation has being completed. Your Reference Number is ' + referenceId + ' while your transaction reference is ' + userRef + '. Note, keep your Reference Number well for your reservation status';
              submitMSG(true, message);
            })
          })
        }
      } else {
        formError();
        submitMSG(false, "PayStack Key Not Found");
      }
    }).catch(function(error) {
      formError();
      submitMSG(false, error);
    });
  }
}

function formSuccess(){
  $("#reserveForm")[0].reset();
}

function formError(){
  $("#reserveForm").removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
    $(this).removeClass();
  });
}

function submitMSG(valid, msg){
  if(valid){
    var msgClasses = "h5 mt-3 text-center tada animated text-success";
  } else {
    var msgClasses = "h5 mt-3 text-center text-danger";
  }
  $("#bookSubmit").removeClass().addClass(msgClasses).text(msg);
}
