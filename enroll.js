
let inputSize = 512
let scoreThreshold = 0.5

let objExpressionDescriptors = {}
const available_expressions = ['neutral', 'angry', 'happy', 'surprised']

function getCurrentFaceDetectionNet() {
  return faceapi.nets.tinyFaceDetector
}

function isFaceDetectionModelLoaded() {
  return !!getCurrentFaceDetectionNet().params
}

function getFaceDetectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}

function hasAllExpressions() {
  return available_expressions.every(function (expression) {
    return objExpressionDescriptors.hasOwnProperty(expression)
  })
}

document.addEventListener('expression_added', (e) => {
  $('#emotion-' + e.detail).addClass('fulfilled');

  if (hasAllExpressions())
    document.dispatchEvent(new CustomEvent('expressions_fulfilled', { detail: Object.values(objExpressionDescriptors) }));
});
document.addEventListener('expressions_fulfilled', (e) => {
  (async () => {
    const { isConfirmed, value } = await Swal.fire({
      title: 'Enroll User',
      html: `
        <input id="swal-input-fullname" class="swal2-input" placeholder="Enter full name">
        <input id="swal-input-matric" class="swal2-input" placeholder="Enter matriculation number">
        <input id="swal-input-department" class="swal2-input" placeholder="Enter department">
        <input id="swal-input-faculty" class="swal2-input" placeholder="Enter faculty">
        <select id="swal-input-year" class="swal2-input">
            <option value="">Select year of study</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
        </select>
        <input type="file" id="swal-input-file" class="swal2-input" accept="image/*" placeholder="Upload school fees receipt">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const fullName = document.getElementById('swal-input-fullname').value;
        const matricNo = document.getElementById('swal-input-matric').value;
        const department = document.getElementById('swal-input-department').value;
        const faculty = document.getElementById('swal-input-faculty').value;
        const yearOfStudy = document.getElementById('swal-input-year').value;
        const fileInput = document.getElementById('swal-input-file');

        if (!fullName || !matricNo || !department || !faculty || !yearOfStudy || !fileInput) {
          Swal.showValidationMessage('Please fill in all fields, including the image.');
          return false; // Return false to indicate validation failure
        }


        return { fullName, matricNo, department, faculty, yearOfStudy, file: fileInput };
      }
    });

    if (isConfirmed) {
      // Use the returned value from preConfirm directly
      const { fullName, matricNo, department, faculty, yearOfStudy, file } = value;

      // Check if the value is defined before calling the function
      if (value) {
        // Get the file

        // Create the image URL for displaying in the popup
        // const imageUrl = URL.createObjectURL(file);
        const imageUrl = getBase64Image(file);
        const label = { fullName, matricNo, department, faculty, yearOfStudy, imageUrl }
        addNewUser(label, e.detail);

        Swal.fire({
          icon: 'success',
          text: `${fullName} with matric number ${matricNo} is enrolled!`
        });

        location.href = '/';
      }
    }
  })();
});

function getBase64Image(img) {
  var canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  var ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0)
  var dataURL = canvas.toDataURL("image/png")
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}


function addNewUser(label, descriptors) {
  db.get('enrollment').push({ label, descriptors }).write();


}

async function onPlay() {
  const videoEl = $('#inputVideo').get(0)

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())


  const options = getFaceDetectorOptions()

  const result = await faceapi.detectSingleFace(videoEl, options)
    .withFaceLandmarks().withFaceExpressions().withFaceDescriptor()

  const canvas = $('#overlay').get(0)

  if (result) {
    const dims = faceapi.matchDimensions(canvas, videoEl, true)

    const resizedResult = faceapi.resizeResults(result, dims)
    const minConfidence = 0.8

    Object.keys(resizedResult.expressions).forEach(key => {
      // skip if other expresssions
      if (available_expressions.indexOf(key) < 0) return

      if (resizedResult.expressions[key] > minConfidence)
        // check if face expression not fulfilled yet 
        if (!objExpressionDescriptors.hasOwnProperty(key)) {
          // update fullfilled face expressions
          objExpressionDescriptors[key] = resizedResult.descriptor
          // trigger event each new expression detected
          document.dispatchEvent(new CustomEvent('expression_added', { detail: key }))
        }
    })
    // default label
    const label = 'new user'
    const options = { label }
    const drawBox = new faceapi.draw.DrawBox(resizedResult.detection.box, options)
    drawBox.draw(canvas)
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
  await faceapi.loadFaceExpressionModel('/')
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