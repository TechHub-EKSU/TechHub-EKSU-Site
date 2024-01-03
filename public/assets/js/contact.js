$("#contactForm").validator().on("submit", function (event) {
  if (event.isDefaultPrevented()) {
    formError();
    submitMSG(false, "Did you fill in the form properly?");
  } else {
    event.preventDefault();
    submitForm();
  }
});

function submitForm(){
  var name = $("#name").val();
  var phone = $("#phone").val();
  var email = $("#email").val();
  var message = $("#message").val();

  var db = firebase.firestore();

  db.collection("ContactMessage").add({
    name: name,
    email: email,
    phone: phone,
    message: message
  })
  .then(function() {
    formSuccess();
  })
  .catch(function(error) {
    formError();
    submitMSG(false,error);
  });
}

function formSuccess(){
  $("#contactForm")[0].reset();
  submitMSG(true, "Your message was sent successfully. Thanks!")
}

function formError(){
  $("#contactForm").removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
    $(this).removeClass();
  });
}

function submitMSG(valid, msg){
  if(valid){
    var msgClasses = "h5 mt-3 text-center tada animated text-success";
  } else {
    var msgClasses = "h5 mt-3 text-center text-danger";
  }
  $("#msgSubmit").removeClass().addClass(msgClasses).text(msg);
}
