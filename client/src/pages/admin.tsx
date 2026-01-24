// This is the file for the admin page that will be used to manage the application and its users.
// It will be accessible only to users with the platform owner or admin roles.
// This page will have a sidebar to navigate between different sections of the admin panel.
// The sections will include: moderation logs, settings, and database management (database page will be only accessible to platform owners and will allow owners to directly edit the database tables)
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
