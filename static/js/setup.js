// Initialize PsiTurk
const psiturk = new PsiTurk(uniqueId, adServerLoc, mode);
var condition = 0


const searchParams = new URLSearchParams(window.location.search);

let local = false;
let prolific = true;


if (mode === "demo" || mode === "{{ mode }}") {
  local = true;
} else {
  condition = parseInt(condition, 10);
}



function logEvent(event, info={}){
  if (typeof(event) == 'object') {
    info = event;
  } else {
    info.event = event;
  }
  info.time = Date.now();
  console.log('logEvent', info);
  psiturk.recordTrialData(info);
}


function saveData() {
  logEvent('saveData attempt')
  return new Promise((resolve, reject) => {
    if (local || mode === 'demo') {
      resolve('local');
      return;
    }
    const timeout = delay(10000, () => {
      logEvent('saveData timeout')
      reject('timeout');
    });
    psiturk.saveData({
      error: () => {
        clearTimeout(timeout);
        logEvent('saveData error')
        reject('error');
      },
      success: () => {
        clearTimeout(timeout);
        logEvent('saveData success')
        resolve();
      }
    });
  });
};


// Test connection to server, then initialize the experiment.
$(window).on('load', () => {
  saveData()
    .then(() => delay(local ? 0 : 500, () => {
      $('#welcome').hide();
      if (local) {
        return runExperiment();
      } else {
        return runExperiment().catch(handleError).then(completeExperiment);
      }
    }))
    .catch(() => $('#data-error').show());
});

function completeExperiment() {
  $.ajax("complete_exp", {
    type: "POST",
    data: { uniqueId }
  });
  logEvent('completeExperiment');
  $('#display').html(`
    <h1>Saving data</h1>
    <p>Please do <b>NOT</b> refresh or leave the page!</p>
    <div id="load-icon"></div>
    <div id="submit-error" class="alert alert-danger">
      <strong>Error!</strong> We couldn't contact the database. We will try <b><span id="ntry"></span></b> more times before continuing without saving the data.
    </div>
  `);
  $("#submit-error").hide();
  let triesLeft = 3;
  const promptResubmit = () => {
    console.log('promptResubmit');
    if (triesLeft > 0) {
      console.log('try again', triesLeft);
      $("#submit-error").show();
      $("#ntry").html(triesLeft);
      triesLeft -= 1;
      return saveData().catch(promptResubmit);
    } else {
      console.log('GIVE UP');
      $('#display').html(`
        <h1>Saving data</h1>
        <div class="alert alert-danger">
          <strong>Error!</strong> We couldn't save your data! Please send us a message on Prolific, then click the button below.
        </div>
        <br><br>
        <button class='btn btn-primary btn-lg' id="resubmit">I reported the error</button>
      `);
      return new Promise(resolve => {
        $('#resubmit').click(() => {
          $('#display').empty();
          resolve('gave up');
        });
      });
    }
  };
  return saveData().catch(promptResubmit).then(showCompletionScreen);
};


async function showCompletionScreen() {
  $('#display').empty();
  if (prolific) {
    $("#load-icon").remove();
    $(window).off("beforeunload");
    $('body').html(`
      <div class='basic-content'>
        <h1>Thanks!</h1>
        <p>Your completion code is <b>${PROLIFIC_CODE}</b>. Click this link to submit:<br>
        <a href="https://app.prolific.co/submissions/complete?cc=${PROLIFIC_CODE}">
          https://app.prolific.co/submissions/complete?cc=${PROLIFIC_CODE}
        </a></p>
      </div>
    `);
  }
};


function handleError(e) {
  console.log('Error in experiment', e);
  let msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : `${e}`;
  const workerIdMessage = typeof workerId !== "undefined" && workerId !== null ? workerId : 'N/A';
  const message = `<pre>Prolific Id: ${workerIdMessage}\n${msg}</pre>`;
  const link = `<a href="mailto:fredcallaway@princeton.edu?subject=ERROR in experiment&body=${encodeURIComponent(message)}">Click here</a> to report the error by email.`;
  $('#display').html(`
    # The experiment encountered an error!
    <b>${link}</b> Please describe at what point in the study the error occurred, and include the following information.
    ${message}
    After reporting the error, click the button below to submit your data and see the completion code.
    <button id="submit">I reported the error</button>
  `);
  $('#submit').click(completeExperiment);
};
