var amount = 1500, userRef, date = new Date();

$("#registerForm").validator().on("submit", function (event) {
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
  var stack = ($("#stack").val());
  var type = ($("#type").val());

  document.getElementById("confirm-name").innerHTML = name;
  document.getElementById("confirm-phone").innerHTML = phone;
  document.getElementById("confirm-email").innerHTML = email;
  document.getElementById("confirm-stack").innerHTML = stack;
  document.getElementById("confirm-type").innerHTML = type;
  document.getElementById("confirm-amount").innerHTML = '₦1,500.00K';
});

function submitForm(){
  $("#confirmation").hide();

  var name = $("#name").val();
  var phone = $("#phone").val();
  var email = $("#email").val();
  var stack = $("#stack").val();
  var type = $("#type").val();

  var db = firebase.firestore();

  db.collection("Settings").doc("PayStack").get().then(function(doc) {
    if (doc.exists) {
      const payStackKey = doc.data().transactionKey;

      db.collection("Registration").doc(email).get().then(function(userDoc) {
        if (userDoc.exists) {
          var user = userDoc.data();
          var exitingMessage = 'Hello, ' + user.email + ' has been registered with ' + user.name + ' as it\'s name. Kindly visit the renewal page to renew your membership or contact TechHub EKSU President if this is an error'
          submitMSG(false, exitingMessage);
          stop();
        } else {
          var handler = PaystackPop.setup({
            key: payStackKey,
            email: email,
            amount: amount * 100,
            currency: 'NGN',
            name: name,
            ref: 'Registration-TechHubEKSU'+Math.floor((Math.random() * 1000000000) + 1),
            metadata: {
              custom_fields: [
                {
                  display_name: "Mobile Number",
                  variable_name: "mobile_number",
                  value: phone
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
            db.collection("Registration-Payment").doc(userRef).set({
              name: name,
              email: email,
              transactionRef: userRef,
              date: firebase.firestore.Timestamp.fromDate(date),
            })
            .catch(function(error) {
              formError();
              submitMSG(false,error);
            })
            .then(function() {
              db.collection("Registration").doc(email).set({
                name: name,
                email: email,
                phone: phone,
                stack: stack,
                type: type,
                date: firebase.firestore.Timestamp.fromDate(date),
              })
              .catch(function(error) {
                formError();
                submitMSG(false, error)
              })
              .then(function() {
                formSuccess();
                var message = 'Transaction successful. Your transaction reference is ' + userRef;
                submitMSG(true, message);
              })
            })
          }
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
  $("#registerForm")[0].reset();
}

function formError(){
  $("#registerForm").removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
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
