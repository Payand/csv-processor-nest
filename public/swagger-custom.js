window.onload = function() {

  const token = localStorage.getItem('jwtToken');

  if (token) {

    window.ui.preauthorizeApiKey('Bearer', 'Bearer ' + token);
  } else {
    console.warn('No token found in local storage. Please set it manually.');
  }
};


function saveToken(token) {
  localStorage.setItem('jwtToken', token);
  console.log('Token saved to local storage.');
}