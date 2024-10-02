
let inputSize = 512
let scoreThreshold = 0.5

let labeledDescriptors = null
let faceMatcher = null

const attendance = []

// const selectedCandidate = document.getElementById('attendance').value

function handleLogin() {
  let username = document.getElementById("username_field").value;

  const allowedUsers = ["nwankeze.david@cu.edu.ng", "registrar@cu.edu.ng", "vc@cu.edu.ng", "chancellor@cu.edu.ng"]
  // const allowedUsers = ["matric 1", "matric 2"]

  if (allowedUsers.includes(username)) {
    localStorage.setItem("user", JSON.stringify({
      username,
    }));

    // close login form
    document.querySelector(".form-wrapper").remove();

    Swal.fire({
      icon: 'success',
      title: 'Authentication Success',
      text: `Logged in as ${username}`,
    }).then(result => {
      // update auth display status
      let authBarDiv = document.querySelector(".auth-bar");

      if (authBarDiv) {
        // update the inner HTML to reflect currently authenticated user
        authBar.innerHTML = `
            <p>Signed In as: ${username}</p>
            <button class="logout-btn" onclick="handleLogout()"><i class="fa fa-sign-out-alt fa-2x"></i></button>
          `;
      } else {
        // create auth bar and append it to header content div
        let headerContentDiv = document.querySelector(".header-content");
        let authBar = document.createElement("div");
        authBar.className = "auth-bar";
        authBar.innerHTML = `
            <p>Signed In as: ${username}</p>
            <button class="logout-btn" onclick="handleLogout()"><i class="fa fa-sign-out-alt fa-2x"></i></button>
          `;
        headerContentDiv.appendChild(authBar);
      }



      // move on to enroll toast
      Swal.fire({
        title: 'Enroll New Face',
        text: "Please be ready in front of camera. You would need to make some face expressions to enroll. Do not worry, we do not save your data anywhere other than your browser storage.",
        icon: 'info',
        showCancelButton: true,
        // confirmButtonColor: '#3085d6',
        // cancelButtonColor: '#d33',
        confirmButtonText: "I am Ready"
      }).then((result) => {
        if (result.value) {
          location.href = '/enroll'
        }
      });
    });
  } else { // when matricNo is not valid
    Swal.fire({
      icon: 'error',
      title: 'Authentication Failed',
      text: 'Account not valid',
    });
  }
}

function getCurrentFaceDetectionNet() {
  return faceapi.nets.tinyFaceDetector
}

function isFaceDetectionModelLoaded() {
  return !!getCurrentFaceDetectionNet().params
}

function getFaceDetectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}

function hasEnrollmentData() {
  return db.get('enrollment').value().length > 0
}

function clearAttendance() {
  db.set('attendance', []).write()
}

function clearUsers() {
  db.set('enrollment', []).write()
  location.href = '/'
}

function enrollUser() {
  if (localStorage.getItem("user")) {
    Swal.fire({
      title: 'Enroll New Face',
      text: "Please be ready in front of camera. You would need to make some face expressions to enroll. Do not worry, we do not save your data anywhere other than your browser storage.",
      icon: 'info',
      showCancelButton: true,
      // confirmButtonColor: '#3085d6',
      // cancelButtonColor: '#d33',
      confirmButtonText: "I am Ready"
    }).then((result) => {
      if (result.value) {
        location.href = '/enroll'
      }
    });
  } else {
    console.error("Not authenticated");
    let candidates_container = document.querySelector(".candidates");

    let loginPage = document.createElement("div");
    loginPage.className = "form-wrapper";
    loginPage.innerHTML =
      `<form action="" onsubmit="event.preventDefault();" class="login-form">
          <div class="form-sect">
            <h1>Attendance System | Login</h1>
          </div>
          <div class="form-sect">
              <input type="text" id="username_field" class="form-input" placeholder="secure pas" />
          </div>
          
          <button class="login-button" onclick="handleLogin()">Submit</button>
        </form>`;

    // video_container.insertBefore(loginPage, candidates_container);
    candidates_container.insertAdjacentElement("beforebegin", loginPage);
  }
}

if (hasEnrollmentData()) {

  // somehow 'descriptors' property is converted to object after saved to lowdb
  // e.g {0: 10, 1: 20, 2: 30} instead of [10, 20, 30]
  labeledDescriptors = db.get('enrollment').value().map(function (ld) { return { label: JSON.stringify(ld.label), descriptors: ld.descriptors.map(function (d) { return Object.values(d) }) } })

  faceMatcher = faceapi.FaceMatcher.fromJSON({
    distanceThreshold: 0.6, // not sure what is this for
    labeledDescriptors: labeledDescriptors
  })

}

const notifiedUsers = new Set();

document.addEventListener('attendance_detected', (e) => {
  const userDetails = e.detail; // This will now be your full label object


  if (!attendance.includes(userDetails.fullName)) {
    attendance.push(userDetails.fullName);
    console.log(attendance);
    notifiedUsers.delete(userDetails.fullName);
  } else {
    console.log(`${userDetails.fullName} has signed in already`);
    if (!notifiedUsers.has(userDetails.fullName)) {
      new PNotify({
        type: 'error',
        text: `${userDetails.fullName} has signed in already`
      });
      notifiedUsers.add(userDetails.fullName); // Mark as notified
    }
  }

  if (db.get('attendance').filter({ name: userDetails.fullName }).value().length == 0) {
    const { fullName, matricNo, department, faculty, imageUrl } = userDetails; // Destructure from object
    // const imageUrl = URL.createObjectURL(file);
    console.log(imageUrl)
    const recieptImage = document.getElementById('reciept');
    recieptImage.src = "data:image/png;base64," + imageUrl;
    new PNotify({
      type: 'success',
      text: `${fullName} is here!!`
    });

    // Popup to display details in a card format
    Swal.fire({
      title: 'Attendance Recorded',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <strong>Name:</strong> ${fullName}<br>
          <strong>Matric Number:</strong> ${matricNo}<br>
          <strong>Department:</strong> ${department}<br>
          <strong>Faculty:</strong> ${faculty}<br>
         <strong>School Fee Receipt:</strong><br>
        <img src="" id="reciept" alt="Receipt" style="max-width: 100%; height: auto;" />
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'OK'
    });

    db.get('attendance').push({ name: fullName, time: Date.now() }).write();
  }
});



async function onPlay() {
  const videoEl = $('#inputVideo').get(0)

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())

  const options = getFaceDetectorOptions()

  const results = await faceapi.detectAllFaces(videoEl, options).withFaceLandmarks()
    .withFaceDescriptors()

  const canvas = $('#overlay').get(0)

  if (results) {

    const dims = faceapi.matchDimensions(canvas, videoEl, true)

    const resizedResults = faceapi.resizeResults(results, dims)

    resizedResults.forEach(({ detection, descriptor }) => {

      let label = 'unknown'
      let boxColor = 'red'
      if (faceMatcher !== null) {
        const bestMatch = faceMatcher.findBestMatch(descriptor);
        if (bestMatch.label !== 'unknown') {
          boxColor = 'green';
          const userDetails = JSON.parse(bestMatch.label);
          label = userDetails.fullName
          document.dispatchEvent(new CustomEvent('attendance_detected', { detail: userDetails }))
        }
      }

      // draw detection box
      const options = { label, boxColor }
      const drawBox = new faceapi.draw.DrawBox(detection.box, options)
      drawBox.draw(canvas)
    })

  } else {
    // clear drawings when no detection
    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  setTimeout(() => onPlay())
}

async function run() {
  // load face detection and face expression recognition models
  if (!isFaceDetectionModelLoaded()) {
    await getCurrentFaceDetectionNet().load('/')
  }
  await faceapi.loadFaceLandmarkModel('/')
  await faceapi.loadFaceRecognitionModel('/')

  // try to access users webcam and stream the images
  // to the video element
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
  const videoEl = $('#inputVideo').get(0)
  videoEl.srcObject = stream
}

$(document).ready(function () {
  run()
})