// This is the file for the admin page that will be used to manage the application and its users.
// It will be accessible only to users with the platform admin role.
// This page will have a sidebar to navigate between different sections of the admin panel.
// The sections will include: moderation logs, settings, and database management.
// The moderation logs section will display a list of moderation actions taken by users with the moderator or admin roles.
// The settings section will allow the admins to configure the application settings.
// The database management section will allow the admins to directly view and manage the database and its tables from within the application.
// There will also be a user management tab where admins can view, edit, and delete users. This tab will also allow admins to assign roles to users.
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
