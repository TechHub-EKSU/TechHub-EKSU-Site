var amount, userRef, date = new Date();

$("#renewalForm").validator().on("submit", function (event) {
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
  var email = ($("#email").val());

  var db = firebase.firestore();

  db.collection("Registration").doc(email).get().then(function(userDoc) {
    if (userDoc.exists) {
      $("#confirmation").show();

      var user = userDoc.data(), amountMes;

      if (user.type === 'Student') {
        amountMes = '₦1,000.00K / Semester';
      } else {
        amountMes = '₦500.00K / Quaterly';
      }

      document.getElementById("confirm-email").innerHTML = user.email;
      document.getElementById("confirm-type").innerHTML = user.type;
      document.getElementById("confirm-amount").innerHTML = amountMes;
    } else {
      $("#confirmation").hide();

      var exitingMessage = 'Hello, ' + email + ' has not been registered. Kindly visit the register page to register as a TechHub EKSU member or contact TechHub EKSU President if this is an error'
      submitMSG(false, exitingMessage);
      stop();
    }
  })
  .catch(function(error) {
    formError();
    submitMSG(false, error)
  })
});

function submitForm(){
  $("#confirmation").hide();

  var email = $("#email").val();

  var db = firebase.firestore();

  db.collection("Settings").doc("PayStack").get().then(function(doc) {
    if (doc.exists) {
      const payStackKey = doc.data().transactionKey;

      db.collection("Registration").doc(email).get().then(function(userDoc) {
        if (userDoc.exists) {
          var user = userDoc.data();

          if (user.type === 'Student') {
            amount = 1000;
          } else {
            amount = 500;
          }

          var handler = PaystackPop.setup({
            key: payStackKey,
            email: user.email,
            amount: amount * 100,
            currency: 'NGN',
            ref: 'Renewal-TechHubEKSU'+Math.floor((Math.random() * 1000000000) + 1),
            metadata: {
              custom_fields: [
                {
                  display_name: "Membership Type",
                  variable_name: "membership_type",
                  value: user.type
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
            db.collection("Renewal-Payment").doc(userRef).set({
              email: user.email,
              type: user.type,
              transactionRef: userRef,
              date: firebase.firestore.Timestamp.fromDate(date),
            })
            .catch(function(error) {
              formError();
              submitMSG(false,error);
            })
            .then(function() {
              formSuccess();
              var message = 'Transaction successful. Your transaction ref is ' + userRef;
              submitMSG(true, message);
            })
          }
        } else {
          $("#confirmation").hide();

          var exitingMessage = 'Hello, ' + email + ' has not been registered. Kindly visit the register page to register as a TechHub EKSU member or contact TechHub EKSU President if this is an error'
          submitMSG(false, exitingMessage);
          stop();
        }
      })
      .catch(function(error) {
        formError();
        submitMSG(false, error)
      })
    } else {
      formError();
      submitMSG(false, "PayStack Key Not Found");
    }
  }).catch(function(error) {
    formError();
    submitMSG(false, error);
  });
}

function formSuccess(){
  $("#renewalForm")[0].reset();
}

function formError(){
  $("#renewalForm").removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
    $(this).removeClass();
  });
}

function submitMSG(valid, msg){
  if(valid){
    var msgClasses = "h5 mt-3 text-center tada animated text-success";
  } else {
    var msgClasses = "h5 mt-3 text-center text-danger";
  }
  $("#formSubmit").removeClass().addClass(msgClasses).text(msg);
}
