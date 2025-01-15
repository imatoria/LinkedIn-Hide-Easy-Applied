(function () {
  // Variables to track script state
  let isStopped = true;
  let inProgress = false;

  let firstNotAppliedJob = null;
  let firstLoadCompleted = false;

  const MatchingData = {
    Applied: "Applied", //Fixed
    WorkLocation: ["India (Remote)", "Jaipur, Rajasthan, India (On-site)", "Jaipur, Rajasthan, India (Remote)"], //Fixed
    DismissedJob: "We won’t show you this job again.", //Fixed
    JobTitle: [
      //Fixed
      "ServiceNow",
      "Service Now",
      "Optimizely",
      "Intern",
      "Rust Developer",
      "Python Developer",
      "Data Scraping",
      "Data scrape",
      "Java Developer",
      "Java Software Engineer",
      "three.js developer",
      "tester",
      "sql developer",
      "database developer",
      "WPF developer",
      "yonder developer",
    ],
    CompanyName: ["Truelancer.com", "Mogi I/O : OTT/Podcast/Short Video Apps for you"], //Fixed
  };

  const StaticText = {
    IsAppliedParsed: "is-applied-parsed", //Fixed
  };
  const QuerySelector = {
    JobCardsScroller: ".scaffold-layout__list > div:nth-of-type(1)", //Fixed
    JobCards: ".scaffold-layout__list-item", //Fixed
    NotParsed: ":not(." + StaticText.IsAppliedParsed + ")", //Fixed
    Applied: ".job-card-container__footer-job-state", //Fixed
    WorkLocation: ".job-card-container__metadata-wrapper span", //Fixed
    DismissedJob: ".job-card-container__footer-item--highlighted", //Fixed
    JobTitle: ".job-card-list__title--link strong", //Fixed
    CompanyName: ".artdeco-entity-lockup__subtitle span", //Fixed
  };

  // Function to hide jobs that have been applied to via Easy Apply
  function hideAppliedJobs() {
    let count = 0;

    // Select all job cards
    let jobCards = document.querySelectorAll(QuerySelector.JobCards);

    jobCards.forEach((card) => {
      // Check if the job has been applied to via Easy Apply
      const appliedBadge = card.querySelector(QuerySelector.Applied);
      const workLocation = card.querySelector(QuerySelector.WorkLocation);
      const dismissedJob = card.querySelector(QuerySelector.DismissedJob);
      const jobTitle = card.querySelector(QuerySelector.JobTitle);
      const companyName = card.querySelector(QuerySelector.CompanyName);

      if (
        (appliedBadge && appliedBadge.innerText.trim() === MatchingData.Applied) ||
        (workLocation && MatchingData.WorkLocation.every((x) => workLocation.innerText.trim() != x)) ||
        (dismissedJob && dismissedJob.innerText.includes(MatchingData.DismissedJob)) ||
        (jobTitle && MatchingData.JobTitle.some((x) => jobTitle.innerText.toLowerCase().indexOf(x.toLowerCase()) > -1)) ||
        (companyName && MatchingData.CompanyName.some((x) => companyName.innerText == x))
      ) {
        jobTitle && log("LinkedIn Hide > " + jobTitle.innerText);
        // Remove the job card
        card.remove();
        count++;
      } else {
        if (!firstNotAppliedJob) firstNotAppliedJob = card;
      }

      //Add that it is parsed to avoid parsing next time.
      card.classList.add(StaticText.IsAppliedParsed);
    });

    // log("LinkedIn Hide > Easy Applied: " + count);

    // Rerun the HideAppliedJobs function if there are jobs to be hidden.
    window.setTimeout(() => {
      jobCards = document.querySelectorAll(QuerySelector.JobCards + QuerySelector.NotParsed);
      if (jobCards.length > 0) hideAppliedJobs();
      else if (firstLoadCompleted == false) clickFirstJob();
    }, 1000);
  }

  function clickFirstJob() {
    window.scrollTo(window.scrollX, 0);
    const jobCardsScroller = document.querySelector(QuerySelector.JobCardsScroller);
    if (jobCardsScroller) jobCardsScroller.scrollTo(0, 0);

    window.setTimeout(() => {
      if (firstNotAppliedJob) firstNotAppliedJob.click();
      firstLoadCompleted = true;
    }, 500);
  }

  // Run the function when the page loads
  window.addEventListener("load", function () {
    hideAppliedJobs();

    // Optionally, re-run the function when the user scrolls or interacts with the page
    const jobCardsScroller = document.querySelector(QuerySelector.JobCardsScroller);
    if (jobCardsScroller) jobCardsScroller.addEventListener("scrollend", hideAppliedJobs);
    document.addEventListener("click", hideAppliedJobs);
  });

  // Check if the UI is already added
  if (!document.getElementById("mLinkedinApplyUI")) {
    // Inject the CSS file into the page
    addInitialPopupUI();
  }

  // Update status text in UI
  function updateStatus() {
    const statusElem = document.getElementById("mLinkedInStatus");
    statusElem.textContent = `Status: ${!isStopped ? "Running" : "Stopped"}`;

    const actionButton = document.getElementById("mLinkedInActionButton");
    actionButton.textContent = isStopped ? "Start" : "Stop";
  }

  // Update counts in UI
  function updateCounts(jobSuccessCount, jobFailCount) {
    const successCount = document.getElementById("mLinkedInSuccessCount");
    const failCount = document.getElementById("mLinkedInFailCount");

    successCount.textContent = jobSuccessCount;
    failCount.textContent = jobFailCount;
  }

  async function startStopHandler() {
    isStopped = !isStopped;
    updateStatus();
    if (!inProgress) await processJobs();
  }

  function addInitialPopupUI() {
    // Create the container for the custom UI
    const container = document.createElement("div");
    container.id = "mLinkedinApplyUI";
    container.innerHTML = `
      <h3>LinkedIn Easy Apply</h3>
      <div id="mLinkedInStatus">Status: Idle</div>
      <button id="mLinkedInActionButton">Start</button>
      <div id="mLinkedInCount">
        <p>Jobs Applied: <span id="mLinkedInSuccessCount">0</span></p>
        <p>Jobs Failed: <span id="mLinkedInFailCount">0</span></p>
      </div>
    `;

    // Append the container to the document body
    document.body.appendChild(container);

    delay(2000);

    const actionButton = document.getElementById("mLinkedInActionButton");

    // Button click listeners
    actionButton.addEventListener("click", startStopHandler);
  }

  // Function to process jobs
  async function processJobs() {
    log("Starting job automation...");
    inProgress = true;

    const jobCards = document.querySelectorAll(".job-card-container");
    let appliedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < jobCards.length; i++) {
      if (isStopped) {
        log("Job automation stopped.");
        break;
      }

      const jobCard = jobCards[i];

      var jobStatus = await performWorkOnJob(jobCard);

      if (jobStatus == null) continue;
      else if (jobStatus) appliedCount++;
      else failedCount++;

      log(`Job automation complete. Applied: ${appliedCount}, Failed: ${failedCount}`);

      // Send counts to the popup
      updateCounts(appliedCount, failedCount);

      log("Completed Job Number: " + (i + 1));

      delay(1000);
    }

    if (!isStopped && appliedCount > 0) await processJobs();
    else {
      // Show Automation has stopped
      if (!isStopped) startStopHandler();

      inProgress = false;
    }
  }

  async function performWorkOnJob(jobCard) {
    // Check if the job has already been applied to
    const jobStateElement = jobCard.querySelector(".job-card-container__footer-job-state");
    if (jobStateElement && jobStateElement.innerText.trim() === "Applied") {
      log(`Job already applied. Skipping...`);
      return null; // Skip the rest of the loop and go to the next iteration
    }

    try {
      // Open job details
      jobCard.click();
      log(`Opening job card...`);

      // Click Easy Apply button
      const easyApplyButton = await waitForElement([".jobs-apply-button"]);
      if (!easyApplyButton) {
        log("Easy Apply button not found. Skipping...");
        return null;
      }
      easyApplyButton.click();

      log("Easy Apply button clicked.");

      // Handle multi-page submission popup
      let isSubmitComplete = false;

      // Loop over  application steps iteratively in modal.
      while (!isSubmitComplete) {
        isSubmitComplete = await fillApplicationAndSubmit(isSubmitComplete);
      }

      log("Job applied successfully.");
      return true;
    } catch (error) {
      console.error("Error applying for job:", error);
      return false;
    }
  }

  async function fillApplicationAndSubmit(isSubmitComplete) {
    //Next button   : data-easy-apply-next-button | data-live-test-easy-apply-next-button
    //Review button : data-easy-apply-next-button | data-live-test-easy-apply-review-button
    //Submit button :                             | data-live-test-easy-apply-submit-button
    const submitButton = await waitForElement([
      "button[data-live-test-easy-apply-next-button]",
      "button[data-live-test-easy-apply-review-button]",
      "button[data-live-test-easy-apply-submit-button]",
    ]);

    //if (!submitButton) return true;

    log("Submit button found.");

    // Check for error messages
    const errorMessages = document.querySelectorAll("[data-test-form-element-error-messages]");
    if (errorMessages.length > 0) {
      log("Errors found. Avoiding submit button click.");

      // Check if "Next Manually" button already exists
      let nextManuallyButton = document.querySelector("#manual-next-button");
      if (!nextManuallyButton) {
        // Create and add "Next Manually" button
        nextManuallyButton = await addManualNextButton(nextManuallyButton, submitButton);

        submitButton.click();
      }
      //return true; // Skip to the next iteration of the while loop
    } else if (!submitButton.hasAttribute("data-live-test-easy-apply-submit-button")) {
      // Handle non-final submit buttons
      submitButton.click();
      await delay(1000);
      log("Submit button clicked. Waiting for potential errors.");
    } else {
      // If this is the final submit button
      isSubmitComplete = await submitApplication(submitButton);

      // Wait for the post-apply modal and close it
      await postApplyModal();
    }

    await delay(1000); // Wait for the next page or action to load

    return isSubmitComplete; // Don't skip current iteration of the while loop
  }

  async function postApplyModal() {
    log("Waiting for post-apply modal...");
    const postApplyModal = await waitForElement(['[aria-labelledby="post-apply-modal"]']);
    if (postApplyModal) {
      log("Post-apply modal found. Closing it...");
      const closeButton = postApplyModal.querySelector("button[data-test-modal-close-btn]");
      if (closeButton) {
        closeButton.click();
        log("Post-apply modal closed.");
      }
    }
  }

  async function submitApplication(submitButton) {
    log("Final submit button found.");

    // Untick the #follow-company-checkbox if present
    const followCheckbox = document.querySelector("#follow-company-checkbox");
    if (followCheckbox && followCheckbox.checked) {
      log("Unticking follow company checkbox.");
      followCheckbox.click();
    }

    submitButton.click();

    return true;
  }

  async function addManualNextButton(manualNextButton, submitButton) {
    manualNextButton = document.createElement("button");
    manualNextButton.id = "manual-next-button";
    manualNextButton.textContent = "Manual Next";

    // Insert the button beside the current submit button
    //submitButton.parentNode.insertBefore(manualNextButton, submitButton.nextSibling);
    submitButton.insertAdjacentElement("afterend", manualNextButton);

    log("Next Manually button added.");

    // Wait for user to click "Next Manually" button
    await new Promise((resolve) => {
      manualNextButton.addEventListener("click", () => {
        log("Next Manually button clicked. Resuming logic...");
        //manualNextButton.remove(); // Remove the button after click
        resolve();
      });
    });
    return manualNextButton;
  }

  // Utility function: Wait for a specific DOM element to appear
  function waitForElement(selectors) {
    return new Promise((resolve, reject) => {
      const timeout = 5 * 60 * 1000; // 5 minutes
      const interval = 1000; // Check every 1000ms
      const endTime = Date.now() + timeout;

      (function checkElement() {
        // Check all selectors for a matching element
        const element = selectors.map((selector) => document.querySelector(selector)).find((el) => el !== null);

        if (element) {
          resolve(element);
        } else if (Date.now() > endTime) {
          resolve(null); // Return null if the element is not found
        } else {
          log("Waiting for: ", selectors);
          setTimeout(checkElement, interval);
        }
      })();
    });
  }

  // Utility function: Delay execution for a specified time
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function log(message, args) {
    console.info("LinkedIn: " + message, args);
  }
})();
