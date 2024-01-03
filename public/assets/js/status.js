var amount, reservedAmount, userRef, date = new Date();

function hide() {
  $("#confirmation").hide()
}

$("#completeStatusForm").validator().on("submit", function (event) {
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
  var refId = ($("#refId").val());

  var db = firebase.firestore();

  db.collection("Reservation").doc(refId).get().then(function(reserveDoc) {
    if (reserveDoc.exists) {
      $("#confirmation").show();
      var reserve = reserveDoc.data();

      if (reserve.status === 'unpaid' & reserve.totalAmount === 0) {
        var message = 'Hello ' + reserve.name + ', kindly contact TechHub EKSU team to explain your reservation better';
        var button = "<button class='mt-4 btn btn-w3layouts btn-block btn-success text-white w-100 font-weight-bold text-uppercase'" + "type='button'" + "onclick='hide()'>" + "Close</button>"
        document.getElementById("action-button").innerHTML = button;
        document.getElementById("status-message").innerHTML = message;
      } else if (reserve.status === 'unpaid' & reserve.totalAmount > 0) {
        reservedAmount = 0.5 * reserve.totalAmount;

        var message = 'Hello ' + reserve.name + ', the amount of your reservation has been fixed with your plan of ' + reserve.date + ' for a total of ' + reserve.hours + ' hours. Kindly use the button below to complete your reservation with ₦' + reservedAmount + '.00K';
        var button = "<button class='mt-4 btn btn-w3layouts btn-block btn-success text-white w-100 font-weight-bold text-uppercase' type='submit'><i class='fa fa-lock'></i> Pay With PayStack</button>"
        document.getElementById("action-button").innerHTML = button;
        document.getElementById("status-message").innerHTML = message;
      } else if(reserve.status === 'reserved') {
        var message = 'Hello ' + reserve.name + ', your reservation amount of ₦' + reserve.reserveAmount + '.00K for ' + reserve.date + ' and a total of ' + reserve.hours +' hours has being received. Kindly use the button below to complete your hall booking with ₦' + reserve.balance + '.00K';
        var button = "<button class='mt-4 btn btn-w3layouts btn-block btn-success text-white w-100 font-weight-bold text-uppercase' type='submit'><i class='fa fa-lock'></i> Pay With PayStack</button>"
        document.getElementById("action-button").innerHTML = button;
        document.getElementById("status-message").innerHTML = message;
      } else if(reserve.status === 'paid' & reserve.balance === 0) {
        var message = 'Hello ' + reserve.name + ' of ' + reserve.company + ', you have successfully completed booking TechHub EKSU hall for ' + reserve.date + ' and a total of ' + reserve.hours + ' hours';
        var button = "<button class='mt-4 btn btn-w3layouts btn-block btn-success text-white w-100 font-weight-bold text-uppercase'" + "type='button'" + "onclick='hide()'>" + "Close</button>"
        document.getElementById("action-button").innerHTML = button;
        document.getElementById("status-message").innerHTML = message;
      } else {
        var message = 'Hello ' + reserve.name + ' of ' + reserve.company + ', something went wrong. Kindly contact TechHub EKSU President to fix this error';
        var button = "<button class='mt-4 btn btn-w3layouts btn-block btn-success text-white w-100 font-weight-bold text-uppercase'" + "type='button'" + "onclick='hide()'>" + "Close</button>"
        document.getElementById("action-button").innerHTML = button;
        document.getElementById("status-message").innerHTML = message;
      }

      document.getElementById("confirm-refid").innerHTML = reserve.referenceId;
      document.getElementById("confirm-name").innerHTML = reserve.name;
      document.getElementById("confirm-company").innerHTML = reserve.company;
      document.getElementById("confirm-plan").innerHTML = reserve.plan;
      document.getElementById("confirm-amount").innerHTML = '₦' + reserve.totalAmount + '.00K';
    } else {
      $("#confirmation").hide();

      var exitingMessage = 'Hello, ' + refId + ' has not been registered. Kindly visit the reservation page to reserve TechHub EKSU hall or contact TechHub EKSU President if this is an error'
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

  var refId = $("#refId").val();

  var db = firebase.firestore();

  db.collection("Settings").doc("PayStack").get().then(function(doc) {
    if (doc.exists) {
      const payStackKey = doc.data().transactionKey;

      db.collection("Reservation").doc(refId).get().then(function(reserveDoc) {
        if (reserveDoc.exists) {
          var reserve = reserveDoc.data();

          if (reserve.status === 'unpaid' & reserve.totalAmount > 0) {
            unpaid();
          } else if(reserve.status === 'reserved') {
            reserved();
          } else {
            var errorMessage = 'Something went wrong. Kindly contact TechHub EKSU President to fix this error';
            submitMSG(false, errorMessage);

            stop();
          }

          function unpaid() {
            reservedAmount = 0.5 * reserve.totalAmount;
            var balance = reserve.totalAmount - reservedAmount;

            var handler = PaystackPop.setup({
              key: payStackKey,
              email: reserve.email,
              amount: reservedAmount * 100,
              currency: 'NGN',
              ref: 'Reserve-TechHubEKSU'+Math.floor((Math.random() * 1000000000) + 1),
              metadata: {
                custom_fields: [
                  {
                    display_name: "Company",
                    variable_name: "company",
                    value: reserve.company
                  }
                ]
              },
              callback: function(response){
                userRef = response.reference;
                unpaidfirebase();
              },
              onClose: function(){
                formError();
                submitMSG(false,"Window Closed");
                stop();
              }
            });
            handler.openIframe();

            function unpaidfirebase() {
              db.collection("Reservation").doc(reserve.referenceId).update({
                status: 'reserved',
                reserveAmount: reservedAmount,
                balance: balance,
              })
              .catch(function(error) {
                formError();
                submitMSG(false,error);
              })
              .then(function() {
                db.collection("Reservation-Payment").doc(userRef).set({
                  referenceId: reserve.referenceId,
                  transactionRef: userRef,
                  date: date,
                })
                .catch(function(error) {
                  formError();
                  submitMSG(false,error);
                })
                .then(function() {
                  formSuccess();
                  var message = 'Transaction successful. Your reservation has being completed. Your Reference Number remains ' + reserve.referenceId + ' while your transaction reference is ' + userRef + '. Note, keep your Reference Number well for your reservation status';
                  submitMSG(true, message);
                })
              })
            }
          }

          function reserved() {
            var handler = PaystackPop.setup({
              key: payStackKey,
              email: reserve.email,
              amount: reserve.balance * 100,
              currency: 'NGN',
              ref: 'HallBooking-TechHubEKSU'+Math.floor((Math.random() * 1000000000) + 1),
              metadata: {
                custom_fields: [
                  {
                    display_name: "Company",
                    variable_name: "company",
                    value: reserve.company
                  }
                ]
              },
              callback: function(response){
                userRef = response.reference;
                reservedfirebase();
              },
              onClose: function(){
                formError();
                submitMSG(false,"Window Closed");
                stop();
              }
            });
            handler.openIframe();

            function reservedfirebase() {
              db.collection("Reservation").doc(reserve.referenceId).update({
                status: 'paid',
                balance: 0,
              })
              .catch(function(error) {
                formError();
                submitMSG(false,error);
              })
              .then(function() {
                db.collection("HallBooking-Payment").doc(userRef).set({
                  referenceId: reserve.referenceId,
                  transactionRef: userRef,
                  date: date,
                })
                .catch(function(error) {
                  formError();
                  submitMSG(false,error);
                })
                .then(function() {
                  formSuccess();
                  var message = 'Transaction successful. Your booking has being completed. Your Reference Number remains ' + reserve.referenceId + ' while your transaction reference is ' + userRef + '. Note, keep your Reference Number well for your reservation status';
                  submitMSG(true, message);
                })
              })
            }
          }
        } else {
          $("#confirmation").hide();

          var exitingMessage = 'Hello, ' + refId + ' has not been registered. Kindly visit the reservation page to reserve TechHub EKSU hall or contact TechHub EKSU President if this is an error'
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
  $("#completeStatusForm")[0].reset();
}

function formError(){
  $("#completeStatusForm").removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
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
