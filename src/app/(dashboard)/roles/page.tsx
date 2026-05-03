"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Shield, Plus, Edit2, Trash2, 
  Users, CheckCircle, AlertCircle, Crown
} from "lucide-react";

// Predefined roles
const defaultRoles = [
  {
    id: "admin",
    name: "Admin",
    description: "Full access to all features and settings",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    permissions: [
      "dashboard.view",
      "analytics.view",
      "social.view",
      "social.manage",
      "ads.view",
      "ads.manage",
      "products.view",
      "products.manage",
      "settings.view",
      "settings.manage",
      "users.view",
      "users.manage",
      "roles.view",
      "roles.manage",
    ],
    isSystem: true,
    userCount: 1,
  },
  {
    id: "member",
    name: "Member",
    description: "View-only access to dashboard and reports",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    permissions: [
      "dashboard.view",
      "analytics.view",
      "social.view",
      "ads.view",
      "products.view",
      "settings.view",
    ],
    isSystem: true,
    userCount: 0,
  },
];

// Permission categories
const permissionCategories = [
  {
    name: "Dashboard",
    permissions: ["dashboard.view"],
  },
  {
    name: "Analytics",
    permissions: ["analytics.view", "analytics.export"],
  },
  {
    name: "Social Media",
    permissions: ["social.view", "social.manage"],
  },
  {
    name: "Ads Manager",
    permissions: ["ads.view", "ads.manage"],
  },
  {
    name: "Products",
    permissions: ["products.view", "products.manage"],
  },
  {
    name: "Settings",
    permissions: ["settings.view", "settings.manage"],
  },
  {
    name: "User Management",
    permissions: ["users.view", "users.manage"],
  },
  {
    name: "Role Management",
    permissions: ["roles.view", "roles.manage"],
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState(defaultRoles);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const getPermissionLabel = (perm: string) => {
    const [category, action] = perm.split(".");
    return `${category.charAt(0).toUpperCase() + category.slice(1)} ${action === "view" ? "View" : "Manage"}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage access roles and permissions
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{roles.length}</p>
              <p className="text-sm text-muted-foreground">Total Roles</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-muted-foreground">System Roles</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{roles.reduce((acc, r) => acc + r.userCount, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.color}`}>
                    {role.id === "admin" ? (
                      <Crown className="w-5 h-5" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{role.name}</p>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">System</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{role.userCount} users</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingRole(editingRole === role.id ? null : role.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!role.isSystem && (
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm) => (
                  <Badge 
                    key={perm} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {getPermissionLabel(perm)}
                  </Badge>
                ))}
              </div>

              {/* Edit Panel */}
              {editingRole === role.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <h4 className="font-medium">Edit Permissions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {permissionCategories.map((cat) => (
                      <div key={cat.name} className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{cat.name}</p>
                        {cat.permissions.map((perm) => (
                          <label key={perm} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={role.permissions.includes(perm)}
                              onChange={() => {
                                setRoles(roles.map(r => 
                                  r.id === role.id 
                                    ? {
                                        ...r,
                                        permissions: r.permissions.includes(perm)
                                          ? r.permissions.filter(p => p !== perm)
                                          : [...r.permissions, perm]
                                      }
                                    : r
                                ));
                              }}
                              className="w-4 h-4"
                            />
                            {perm.split(".")[1]}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingRole(null)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm">Save Changes</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Permission Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {permissionCategories.map((cat) => (
              <div key={cat.name} className="p-3 rounded-lg bg-accent/50">
                <p className="font-medium mb-2">{cat.name}</p>
                <div className="space-y-1">
                  {cat.permissions.map((perm) => (
                    <p key={perm} className="text-sm text-muted-foreground">
                      • {getPermissionLabel(perm)}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}