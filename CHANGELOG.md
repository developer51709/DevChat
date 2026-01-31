# Changelog

<details>
  <summary>January 24, 2026</summary>
  <ul>
    <li>Added account/profile settings</li>
    <li>Added a more mobile friendly UI</li>
    <li>Created <code>CHANGELOG.md</code> file</li>
  </ul>
</details>
<details>
  <summary>January 25, 2026</summary>
  <ul>
    <li>Updated chat to show display names by default</li>
    <li>Added user profile pages</li>
    <li>Added profile badges for admin/moderator accounts</li>
    <li>Added bio section to account/profile settings</li>
    <li>Added admin account setup</li>
    <li>Limited chanel creation to admin users only</li>
    <li>Added channel editing and deletion endpoints</li>
    <li>Added UI buttons for the channel management endpoints</li>
  </ul>
</details>
<details>
  <summary>January 26, 2026</summary>
  <ul>
    <li>Updated website open graph tags</li>
  </ul>
</details>
<details>
  <summary>January 27, 2026</summary>
  <ul>
    <li>Added admin page option in settings</li>
    <li>Added moderation actions</li>
    <li>Implemented the admin page</li>
    <li>Added user management tab to the admin page</li>
    <li>Added moderation logs tab to the admin page</li>
    <li>Started implementing DM channels</li>
    <li>Added token based authentication</li>
  </ul>
</details>
<details>
  <summary>January 31, 2026</summary>
  <ol>
    <li><strong>Direct Message Visibility:</strong> <br>Fixed a bug where DM messages weren't appearing by adding the correct data fetching logic and updating the server route.</li>
    <li><strong>Moderation Reports Security:</strong> <br>Restricted the visibility of the "Moderation Reports" button to Admin accounts only. Normal users no longer see this button in their side panel.</li>
    <li><strong>Channel Deletion:</strong> <br>Added a delete button for channels (visible to admins) with a confirmation dialog to prevent accidental deletions.</li>
    <li><strong>Emoji Reactions:</strong> <br>Implemented a real-time emoji reaction system. Users can now add and toggle reactions on messages via a new menu option.</li>
    <li><strong>File Sharing (Foundation):</strong> <br>Updated the database schema to support attachments and added a file upload trigger to the message input.</li>
    <li><strong>App Issue Reporting:</strong> <br>Added a new backend endpoint to handle app-related issue reports, allowing users to submit feedback directly through the platform.</li>
  </ol>
</details>