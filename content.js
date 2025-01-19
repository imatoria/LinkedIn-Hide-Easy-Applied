(async function () {
  // Variables to track script state
  let isStopped = true;
  let inProgress = false;

  let countApplied = 0;
  let countFailed = 0;
  let countSkipped = 0;

  const MatchingData = {
    Applied: "Applied",
    WorkLocationExcludes: ["(On-site)"],
    WorkLocationIncludes: ["(Remote)", "Jaipur, Rajasthan, India (On-site)"],
    DismissedJob: "We won’t show you this job again.",
    JobTitle: [
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
      "Salesforce",
      "Kotlin",
      "Embedded System",
      "Vue JS",
      "Drupal Developer",
      "Blockchain",
      "Shopify",
    ],
    CompanyName: ["Truelancer.com", "Mogi I/O : OTT/Podcast/Short Video Apps for you", "EPAM Systems", "Applicantz"],
  };

  const StaticText = {
    IsAppliedParsed: "is-applied-parsed",
    NotAcceptingApplications: "No longer accepting applications",
    AlreadyApplied: "Applied ",
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

    const actionButton = document.getElementById("mLinkedInActionButton");
    actionButton.textContent = isStopped ? "Start" : "Stop";
  }

  // Update counts in UI
  function updateCounts() {
    const successCount = document.getElementById("mLinkedInSuccessCount");
    const failCount = document.getElementById("mLinkedInFailCount");
    const skippedCount = document.getElementById("mLinkedInSkippedCount");

    successCount.innerText = countApplied;
    failCount.innerText = countFailed;
    skippedCount.innerText = countSkipped;
  }

  async function startStopHandler() {
    isStopped = !isStopped;
    updateStatus();
    if (!inProgress) await processJobs();
  }

  async function addInitialPopupUI() {
    // Create the container for the custom UI
    const container = document.createElement("div");
    container.id = "mLinkedinApplyUI";
    container.innerHTML = `
      <h3>mLinkedIn</h3>
      <div id="mLinkedInBody">
        <div id="mLinkedInStatus">Idle</div>
        <button id="mLinkedInActionButton">Start</button>
        <table id="mLinkedInCount">
        <tbody>
          <tr><th>Applied</th><td>&nbsp;:&nbsp;</td><td id="mLinkedInSuccessCount">0</td></tr>
          <tr><th>Failed</th><td>&nbsp;:&nbsp;</td><td id="mLinkedInFailCount">0</td></tr>
          <tr><th>Skipped</th><td>&nbsp;:&nbsp;</td><td id="mLinkedInSkippedCount">0</td></tr>
        </tbody>
        </table>
      </div>
    `;

    // Append the container to the document body
    document.body.appendChild(container);

    await delay(2000);

    const actionButton = document.getElementById("mLinkedInActionButton");

    // Button click listeners
    actionButton.addEventListener("click", startStopHandler);
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

      await scrollToElement(jobCard, document.querySelector(QuerySelector.JobCardsScroller));

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
      } else {
        var jobStatus = await performWorkOnJob(jobCard);

        if (jobStatus == null) continue;
        else if (jobStatus) countApplied++;
        else countFailed++;

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

    try {
      // Open job details
      jobCard.click();
      log(`Opening job card...`);

      await delay(1000);

      // Check if the job has already been applied to
      const jobStateElement = document.querySelector(QuerySelector.AlreadyApplied);
      if (jobStateElement && jobStateElement.innerText.trim().startsWith(MatchingData.Applied)) {
        log(`Job already applied. Skipping...`);
        countSkipped++;
        return null; // Skip the rest of the loop and go to the next iteration
      }

      // Click Easy Apply button
      const easyApplyButton = await waitForElement([QuerySelector.EasyApplyButton]);
      if (!easyApplyButton) {
        log("Easy Apply button not found. Skipping...");
        countSkipped++;
        return null;
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

        if (isSubmitComplete === true) {
          // Wait for the post-apply modal and close it
          var isPostApplyProcessed = await postApplyModal();
          if (!isPostApplyProcessed) return null; // Returning null to abort automation
          await delay(1000);
        }
      }

      log("Job applied successfully.");
      return true;
    } catch (error) {
      console.error("Error applying for job:", error);
      return false;
    }
  }

  async function fillApplicationAndSubmit(isSubmitComplete) {
    //Safety button :                             | data-live-test-job-apply-button
    //Next button   : data-easy-apply-next-button | data-live-test-easy-apply-next-button
    //Review button : data-easy-apply-next-button | data-live-test-easy-apply-review-button
    //Submit button :                             | data-live-test-easy-apply-submit-button
    const submitButton = await waitForElement([
      //QuerySelector.ApplySafetyButton,
      QuerySelector.ApplyNextButton,
      QuerySelector.ApplyReviewButton,
      QuerySelector.ApplySubmitButton,
    ]);

    if (!submitButton) return null;

    log("Next/Review/Submit button found.");

    // Check for error messages
    const errorMessages = document.querySelectorAll(QuerySelector.ErrorMessages);
    if (errorMessages.length > 0) {
      log("Errors found. Avoiding submit button click.");

      // Check if "Next Manually" button already exists
      let manualNextButton = document.querySelector(QuerySelector.ManualNext);
      if (!manualNextButton) {
        // Create and add "Next Manually" button
        manualNextButton = await addManualNextButton(manualNextButton, submitButton);
      }
    } else if (submitButton.innerText.trim() !== "Submit application") {
      // Handle non-final submit buttons
      submitButton.click();
      log("Next/Review button clicked.");
    } else {
      // If this is the final submit button
      isSubmitComplete = await submitApplication(submitButton);
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
      log("Unticking follow company checkbox.");
      followCheckbox.click();
    }

    submitButton.click();

    return true;
  }

  async function addManualNextButton(manualNextButton, submitButton) {
    manualNextButton = document.createElement("button");
    manualNextButton.id = QuerySelector.ManualNext.substring(1);
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
          resolve(element);
        } else if (Date.now() > endTime) {
          resolve(null); // Return null if the element is not found
        } else {
          log("Waiting for: ", ...selectors);
          setTimeout(checkElement, interval);
        }
      })();
    });
  }

  async function scrollToElement(element, container) {
    // Get the element's position relative to the container
    const elementOffset = element.offsetTop;

    // Define the target scroll position
    const targetScrollTop = elementOffset;

    // Start scrolling the container to the target position
    container.scrollTo({
      top: targetScrollTop,
      //behavior: "smooth", // Enables smooth scrolling
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
