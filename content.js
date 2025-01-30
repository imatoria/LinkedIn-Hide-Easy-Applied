(async function () {
  // Variables to track script state
  let isStopped = true;
  let inProgress = false;

  let countApplied = 0;
  let countSkipped = 0;

  const MatchingData = {
    Applied: "Applied",
    WorkLocationExcludes: ["(On-site)"],
    WorkLocationIncludes: ["(Remote)", "Jaipur, Rajasthan, India (On-site)"],
    DismissedJob: "We won’t show you this job again.",
    JobTitle: [
      "AEM developer",
      "Animation Developer",
      "Blockchain",
      "C developer",
      "C++",
      "Data Engineer",
      "Data Scraping",
      "Data scrape",
      "D365",
      "Drupal Developer",
      "Dynamics",
      "Embedded System",
      "Golang",
      "Intern",
      "Java Developer",
      "Java Software Engineer",
      "Kotlin",
      "Mern Stack Developer",
      "MongoDB developer",
      "Optimizely",
      "Python Developer",
      "Robotic",
      "Rust Developer",
      "Salesforce",
      "Service Now",
      "ServiceNow",
      "Siebel Developer",
      "Shopify",
      "SQL developer",
      "tester",
      "test engineer",
      "three.js developer",
      "Unity developer",
      "Vue JS",
      "web 3",
      "web3",
      "WPF developer",
      "yonder developer",
    ],
    CompanyName: ["Truelancer.com", "Mogi I/O : OTT/Podcast/Short Video Apps for you", "EPAM Systems", "Applicantz", "OptimHire"],
  };

  const StaticText = {
    IsAppliedParsed: "is-applied-parsed",
    NotAcceptingApplications: "No longer accepting applications",
    AlreadyApplied: "Applied ",
    EasyApplyDailyLimit: "You’ve reached the Easy Apply application limit for today",
    ShowReasonClass: "show-reason",
    AnsweredClass: "answered",
  };
  const QuerySelector = {
    JobCardsScroller: ".scaffold-layout__list > div:nth-of-type(1)",
    JobCards: ".scaffold-layout__list-item",
    JobCardClickable: "div[data-view-name='job-card']", // This should respond to click event and open job details
    NotParsed: ":not(." + StaticText.IsAppliedParsed + ")",
    Applied: ".job-card-container__footer-job-state",
    WorkLocation: ".job-card-container__metadata-wrapper span",
    DismissedJob: ".job-card-container__footer-item--highlighted",
    JobTitle: ".job-card-list__title--link strong",
    CompanyName: ".artdeco-entity-lockup__subtitle span",
    JobCardDialog: "[role='dialog']",
    ErrorMessages: "[data-test-form-element-error-messages]",
    ManualNext: "#manual-next-button",
    PostApplyModalClose: "button[data-test-modal-close-btn]",
    FollowCheckbox: "#follow-company-checkbox",
    EasyApplyButton: ".jobs-apply-button",
    ApplySafetyButton: "button[data-live-test-job-apply-button]",
    ApplyNextButton: "button[data-live-test-easy-apply-next-button]",
    ApplyReviewButton: "button[data-live-test-easy-apply-review-button]",
    ApplySubmitButton: "button[data-live-test-easy-apply-submit-button]",
    PostApplyModal: "[aria-labelledby='post-apply-modal']",
    JobDetail: ".jobs-search__job-details",
    NotAcceptingApplications: ".jobs-details-top-card__apply-error",
    AlreadyApplied: ".artdeco-inline-feedback__message", //
    DiscardJob: ".job-card-list__actions-container button[aria-label^='Dismiss']",
  };

  // Check if the UI is already added
  if (!document.getElementById("mLinkedinApplyUI")) {
    // Inject the CSS file into the page
    await addInitialPopupUI();
  }

  // Update status text in UI
  function updateStatus() {
    const statusElem = document.getElementById("mLinkedInStatus");
    statusElem.textContent = !isStopped ? "Running" : "Stopped";

    const actionButton = document.getElementById("mLinkedInButtonStart");
    actionButton.textContent = isStopped ? "Start" : "Stop";
  }

  // Update counts in UI
  function updateCounts() {
    const successCount = document.getElementById("mLinkedInSuccessCount");
    const skippedCount = document.getElementById("mLinkedInSkippedCount");

    successCount.innerText = countApplied;
    skippedCount.innerText = countSkipped;
  }

  async function startStopHandler() {
    isStopped = !isStopped;
    updateStatus();
    if (!inProgress) await processJobs();
  }
  async function pauseHandler() {}

  async function discardHandler() {
    isStopped = !isStopped;
    updateStatus();
    if (!inProgress) {
    }
  }

  async function addInitialPopupUI() {
    // Create the container for the custom UI
    const container = document.createElement("div");
    container.id = "mLinkedinApplyUI";
    container.innerHTML = `
      <h3>mLinkedIn</h3>
      <div id="mLinkedInBody">
        <div id="mLinkedInStatus">Idle</div>
        <button id="mLinkedInButtonStart">Start</button>
        <button id="mLinkedInButtonPause">Pause</button>
        <button id="mLinkedInButtonDiscard">Discard</button>
        <table id="mLinkedInCount">
        <tbody>
          <tr><th>Applied</th><td>&nbsp;:&nbsp;</td><td id="mLinkedInSuccessCount">0</td></tr>
          <tr><th>Skipped</th><td>&nbsp;:&nbsp;</td><td id="mLinkedInSkippedCount">0</td></tr>
        </tbody>
        </table>
      </div>
    `;

    // Append the container to the document body
    document.body.appendChild(container);

    await delay(2000);

    const btnStart = document.getElementById("mLinkedInButtonStart");
    const btnPause = document.getElementById("mLinkedInButtonPause");
    const btnDicard = document.getElementById("mLinkedInButtonDiscard");

    // Button click listeners
    btnStart.addEventListener("click", startStopHandler);
    btnPause.addEventListener("click", pauseHandler);
    btnDicard.addEventListener("click", discardHandler);
  }

  // Function to hide jobs that have been applied to via Easy Apply
  async function processJobs() {
    log("Starting job automation...");
    inProgress = true;

    // Select all job cards
    let jobCards = document.querySelectorAll(QuerySelector.JobCards);

    log("LinkedIn Hide > Total Jobs: ", jobCards.length);

    for (const jobCard of jobCards) {
      if (isStopped) {
        log("Job automation stopped.");
        break;
      }

      // Check if the job has been applied to via Easy Apply
      const appliedBadge = jobCard.querySelector(QuerySelector.Applied);
      const workLocation = jobCard.querySelector(QuerySelector.WorkLocation);
      const dismissedJob = jobCard.querySelector(QuerySelector.DismissedJob);
      const jobTitle = jobCard.querySelector(QuerySelector.JobTitle);
      const companyName = jobCard.querySelector(QuerySelector.CompanyName);

      await scrollToElement(jobCard); //document.querySelector(QuerySelector.JobCardsScroller)

      if (
        (appliedBadge && appliedBadge.innerText.trim() === MatchingData.Applied) || //IsAppliedParsed
        (workLocation &&
          MatchingData.WorkLocationExcludes.every((x) => workLocation.innerText.trim().indexOf(x) > -1) &&
          MatchingData.WorkLocationIncludes.every((x) => workLocation.innerText.trim().indexOf(x) == -1)) ||
        (dismissedJob && dismissedJob.innerText.includes(MatchingData.DismissedJob)) ||
        (jobTitle && MatchingData.JobTitle.some((x) => jobTitle.innerText.toLowerCase().indexOf(x.toLowerCase()) > -1)) ||
        (companyName && MatchingData.CompanyName.some((x) => companyName.innerText == x))
      ) {
        log("LinkedIn Hide > ", jobTitle && jobTitle.innerText, companyName && companyName.innerText);
        countSkipped++;

        // Dismiss the job if it has not been applied to
        if (appliedBadge && appliedBadge.innerText.trim() === MatchingData.Applied) {
          appliedBadge.classList.add(StaticText.ShowReasonClass);
          log("LinkedIn Hide > Already applied to job");
        } else {
          const discardButton = jobCard.querySelector(QuerySelector.DiscardJob);
          if (discardButton) discardButton.click();

          if (
            workLocation &&
            MatchingData.WorkLocationExcludes.every((x) => workLocation.innerText.trim().indexOf(x) > -1) &&
            MatchingData.WorkLocationIncludes.every((x) => workLocation.innerText.trim().indexOf(x) == -1)
          ) {
            workLocation.classList.add(StaticText.ShowReasonClass);
            log("LinkedIn Hide > Dismissed job due to location");
          } else if (dismissedJob && dismissedJob.innerText.includes(MatchingData.DismissedJob)) {
            dismissedJob.classList.add(StaticText.ShowReasonClass);
            log("LinkedIn Hide > Dismissed job due to job status");
          } else if (jobTitle && MatchingData.JobTitle.some((x) => jobTitle.innerText.toLowerCase().indexOf(x.toLowerCase()) > -1)) {
            jobTitle.classList.add(StaticText.ShowReasonClass);
            log("LinkedIn Hide > Dismissed job due to job title");
          } else if (companyName && MatchingData.CompanyName.some((x) => companyName.innerText == x)) {
            companyName.classList.add(StaticText.ShowReasonClass);
            log("LinkedIn Hide > Dismissed job due to company name");
          }
        }
      } else {
        var jobStatus = await performWorkOnJob(jobCard);

        if (jobStatus == false) continue;
        else countApplied++;

        log("Job Completed.", "Job Status:", jobStatus ? "Success" : "Failed");
      }

      // Send counts to the popup
      updateCounts();
    }

    // Show Automation has stopped
    if (!isStopped) startStopHandler();

    inProgress = false;
  }

  async function performWorkOnJob(jobCard) {
    jobCard = await waitForElement([QuerySelector.JobCardClickable], jobCard);

    // Open job details
    jobCard.click();
    log(`Opening job card...`);

    await delay(1000);

    // Check if the job has already been applied to
    const jobStateElement = document.querySelector(QuerySelector.AlreadyApplied);
    if (jobStateElement) {
      if (jobStateElement.innerText.trim().startsWith(MatchingData.Applied)) {
        log(`Job already applied. Skipping...`);
        countSkipped++;
        return false; // Skip the rest of the loop and go to the next iteration
      } else if (jobStateElement.innerText.trim().indexOf(StaticText.EasyApplyDailyLimit) > -1) {
        log(`Easy Apply application limit for today. Stopping automation...`);

        // Show Automation has stopped
        if (!isStopped) startStopHandler();

        return false; // Skip the rest of the loop and go to the next iteration
      }
    }

    // Click Easy Apply button
    const easyApplyButton = await waitForElement([QuerySelector.EasyApplyButton]);
    if (!easyApplyButton) {
      log("Easy Apply button not found. Skipping...");
      countSkipped++;
      return false;
    }
    easyApplyButton.click();

    log("Easy Apply button clicked.");

    // Handle multi-page submission popup
    let isSubmitComplete = false;

    // Loop over  application steps iteratively in modal.
    while (!isSubmitComplete) {
      if (isStopped) {
        log("Job automation stopped.");
        break;
      }
      isSubmitComplete = await fillApplicationAndSubmit(isSubmitComplete);
    }

    if (isSubmitComplete === true) {
      // Wait for the post-apply modal and close it
      var isPostApplyProcessed = await postApplyModal();
      if (!isPostApplyProcessed) return false; // Returning null to abort automation
      await delay(1000);
    }

    log("Job applied successfully.");
    return true;
  }

  async function fillApplicationAndSubmit(isSubmitComplete) {
    var jobCardDialog = await waitForElement([QuerySelector.JobCardDialog]);

    //Safety button :                             | data-live-test-job-apply-button
    //Next button   : data-easy-apply-next-button | data-live-test-easy-apply-next-button
    //Review button : data-easy-apply-next-button | data-live-test-easy-apply-review-button
    //Submit button :                             | data-live-test-easy-apply-submit-button
    const submitButton = await waitForElement(
      [QuerySelector.ApplySafetyButton, QuerySelector.ApplyNextButton, QuerySelector.ApplyReviewButton, QuerySelector.ApplySubmitButton],
      jobCardDialog
    );

    if (!submitButton) return false;

    log("Next/Review/Submit button found.");

    // Check for error messages
    const errorMessages = jobCardDialog.querySelectorAll(QuerySelector.ErrorMessages);
    if (errorMessages.length > 0) {
      await scrollToElement(errorMessages[0]);
      log("Errors found. Avoiding submit button click.");

      await addAnswersToKnownQuestions(errorMessages);

      // Check if "Next Manually" button already exists
      let manualNextButton = jobCardDialog.querySelector(QuerySelector.ManualNext);
      if (!manualNextButton) {
        // Create and add "Next Manually" button
        await addManualNextButton(submitButton);
      }
    } else if (submitButton.innerText.trim() !== "Submit application") {
      // Handle non-final submit buttons
      await scrollToElement(submitButton);
      submitButton.click();
      log("Next/Review button clicked.");
    } else {
      // If this is the final submit button
      await submitApplication(submitButton);
      isSubmitComplete = true;
    }

    await delay(1000); // Wait for the next page or action to load

    return isSubmitComplete; // Don't skip current iteration of the while loop
  }

  async function postApplyModal() {
    log("Waiting for post-apply modal...");
    const postApplyModal = await waitForElement([QuerySelector.PostApplyModal]);
    if (!postApplyModal) return;

    log("Post-apply modal found. Closing it...");
    const closeButton = await waitForElement([QuerySelector.PostApplyModalClose], postApplyModal);
    if (closeButton) {
      closeButton.click();
      log("Post-apply modal closed.");
    }
    return true;
  }

  async function submitApplication(submitButton) {
    log("Final submit button found.");

    // Untick the #follow-company-checkbox if present
    const followCheckbox = document.querySelector(QuerySelector.FollowCheckbox);
    if (followCheckbox && followCheckbox.checked) {
      await scrollToElement(followCheckbox);
      log("Unticking follow company checkbox.");
      followCheckbox.click();
    }

    await scrollToElement(submitButton);
    submitButton.click();
  }

  async function addManualNextButton(submitButton) {
    var manualNextButton = document.createElement("button");
    manualNextButton.id = QuerySelector.ManualNext.substring(1);
    manualNextButton.textContent = "Manual Next";

    // Insert the button beside the current submit button
    submitButton.insertAdjacentElement("beforebegin", manualNextButton);

    log("Next Manually button added.");

    // Wait for user to click "Next Manually" button
    await new Promise((resolve) => {
      manualNextButton.addEventListener("click", () => {
        log("Next Manually button clicked. Resuming logic...");
        resolve();
      });
    });
  }

  async function addAnswersToKnownQuestions(errorMessages) {
    // Get label element which is under same parent but one of the previous siblings as the errorMessage element
    for (let i = 0; i < errorMessages.length; i++) {
      const parentElement = errorMessages[i].parentElement.parentElement;
      const questionLabel = parentElement.querySelector("label");
      const answerTextbox = parentElement.querySelector("input[type='text']");
      const answerRadio = parentElement.querySelector("input[type='radio']");
      const answerSelect = parentElement.querySelector("select");

      if (!questionLabel) continue;

      const question = questionLabel.innerText.toLowerCase();

      try {
        if (answerTextbox) {
          if (question.indexOf("current ctc") > -1 || question.indexOf("cctc") > -1 || question.indexOf("your ctc") > -1) {
            addAnsweredClass(questionLabel);
            await simulateTyping(answerTextbox, "3600000");
          } else if (
            question.indexOf("expected ctc") > -1 ||
            question.indexOf("ectc") > -1 ||
            question.indexOf("expected salary") > -1 ||
            question.indexOf("salary expectation") > -1
          ) {
            addAnsweredClass(questionLabel);
            await simulateTyping(answerTextbox, "4200000");
          } else if (question.indexOf("location") > -1) {
            addAnsweredClass(questionLabel);
            await simulateTyping(answerTextbox, "Jaipur");
          } else if (question.indexOf("join") > -1 || question.indexOf("notice period") > -1) {
            addAnsweredClass(questionLabel);
            await simulateTyping(answerTextbox, "7");
          } else if (question.indexOf("immediate basis") > -1 || question.indexOf("notice period") > -1) {
            addAnsweredClass(questionLabel);
            await simulateTyping(answerTextbox, "7");
          }
        } else if (answerSelect) {
          if (question.indexOf("immediate basis") > -1 || question.indexOf("start immediately") > -1) {
            addAnsweredClass(questionLabel);
            answerSelect.selectedIndex = 1;
          }
        }
      } catch (ex) {
        log("Error while adding answers to known questions.", ex);
      }
    }
  }

  function simulateTyping(textbox, text, delay = 200) {
    return new Promise((resolve, reject) => {
      var len = text.length;
      textbox.focus();

      let index = 0;
      const intervalId = setInterval(() => {
        if (index >= len) {
          clearInterval(intervalId);
          //textbox.blur();
          resolve();
          return;
        }

        var key = text.charAt(index);
        const keydownEvent = new KeyboardEvent("keydown", {
          key: key,
          code: key,
          bubbles: true,
        });

        textbox.dispatchEvent(keydownEvent);

        // Update the input field value
        textbox.value += key;

        // Create and dispatch an input event
        const inputEvent = new InputEvent("input", {
          bubbles: true,
        });
        textbox.dispatchEvent(inputEvent);

        // Create and dispatch a keyup event
        const keyupEvent = new KeyboardEvent("keyup", {
          key: key,
          code: key,
          bubbles: true,
        });
        textbox.dispatchEvent(keyupEvent);

        index++;
      }, delay);
    });
  }

  function addAnsweredClass(questionLabel) {
    questionLabel.classList.add(StaticText.AnsweredClass);
  }

  // Utility function: Wait for a specific DOM element to appear
  function waitForElement(selectors, context = document) {
    return new Promise((resolve, reject) => {
      const timeout = 5 * 60 * 1000; // 5 minutes
      const interval = 1000; // Check every 1000ms
      const endTime = Date.now() + timeout;

      (function checkElement() {
        if (isStopped) {
          log("Job automation stopped.");
          resolve(null); // Return null if the automation is stopped
        }

        // Check all selectors for a matching element
        const element = selectors.map((selector) => context.querySelector(selector)).find((el) => el !== null);

        if (element) {
          //log("Found Element: ", ...selectors);
          resolve(element);
        } else if (Date.now() > endTime) {
          //log("Failed to find Element: ", ...selectors);
          resolve(null); // Return null if the element is not found
        } else {
          log("Waiting for: ", ...selectors);
          setTimeout(checkElement, interval);
        }
      })();
    });
  }

  async function scrollToElement(element) {
    element.scrollIntoView({
      behavior: "smooth", // Enables smooth scrolling
      block: "center", // Aligns the element to the center of the container
    });
    await delay(1000);
  }

  // Utility function: Delay execution for a specified time
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function log() {
    console.info("LinkedIn: ", ...(arguments ?? ""));
  }
})();
