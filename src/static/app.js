document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function escapeHtml(text) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function showMessage(message, type = "info") {
      messageDiv.textContent = message;
      messageDiv.className = type;
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    }

    async function unregisterParticipant(activity, email) {
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );

        const result = await response.json();

        if (response.ok) {
          showMessage(result.message, "success");
          fetchActivities();
        } else {
          showMessage(result.detail || "Failed to remove participant.", "error");
        }
      } catch (error) {
        showMessage("Failed to remove participant. Please try again.", "error");
        console.error("Error unregistering participant:", error);
      }
    }

    // Function to fetch activities from API
    async function fetchActivities() {
      try {
        const response = await fetch("/activities");
        const activities = await response.json();

        // Clear loading message and reset activity dropdown
        activitiesList.innerHTML = "";
        activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

        // Populate activities list
        Object.entries(activities).forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";

          const spotsLeft = details.max_participants - details.participants.length;

          const participantsHtml = details.participants.length
            ? `<ul class="participants-list">${details.participants
                .map(
                  (participant) =>
                    `<li class="participant-item"><span class="participant-email">${escapeHtml(participant)}</span><button type="button" class="delete-participant-button" data-activity="${escapeHtml(name)}" data-participant="${escapeHtml(participant)}" aria-label="Remove ${escapeHtml(participant)}">&times;</button></li>`
                )
                .join("")}</ul>`
            : `<p class="no-participants">No participants yet.</p>`;

          activityCard.innerHTML = `
            <h4>${escapeHtml(name)}</h4>
            <p>${escapeHtml(details.description)}</p>
            <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants-section">
              <h5>Participants</h5>
              ${participantsHtml}
            </div>
          `;

          activitiesList.appendChild(activityCard);

          // Wire up delete buttons for participants
          activityCard.querySelectorAll(".delete-participant-button").forEach((button) => {
            button.addEventListener("click", () => {
              const participant = button.dataset.participant;
              const activity = button.dataset.activity;
              unregisterParticipant(activity, participant);
            });
          });

          // Add option to select dropdown
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        });
      } catch (error) {
        activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
        console.error("Error fetching activities:", error);
      }
    }

    // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
