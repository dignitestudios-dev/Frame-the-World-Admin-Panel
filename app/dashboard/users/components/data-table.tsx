"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  EllipsisVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "./user-form-dialog";

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  plan: string;
  billing: string;
  status: string;
  joinedDate: string;
  lastLogin: string;
}

interface UserFormValues {
  name: string;
  email: string;
  role: string;
  plan: string;
  billing: string;
  status: string;
}

interface DataTableProps {
  users: User[];
  onDeleteUser: (id: number) => void;
  onEditUser: (user: User) => void;
  onAddUser: (userData: UserFormValues) => void;
}

export function DataTable({
  users,
  onDeleteUser,
  onEditUser,
  onAddUser,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(Math.ceil(users.length / 10));

  useEffect(() => {
    setTotalPages(Math.ceil(users.length / pageSize));
  }, [users.length, pageSize]);

  const handleFilterChange = (filterType: string, value: string) => {
    console.log(`${filterType}: ${value}`);
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value);
    const newTotalPages = Math.ceil(users.length / newPageSize);
    setPageSize(newPageSize);
    setTotalPages(newTotalPages);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
    console.log(`Page size changed to ${value}, current page ${currentPage}`);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      console.log(`Page changed to ${newPage}`);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      console.log(`Page changed to ${newPage}`);
      // API Call
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50";
      case "Pending":
        return "text-orange-600 bg-orange-50";
      case "Error":
        return "text-red-600 bg-red-50";
      case "Inactive":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "text-red-600 bg-red-50";
      case "Editor":
        return "text-blue-600 bg-blue-50";
      case "Author":
        return "text-yellow-600 bg-yellow-50";
      case "Maintainer":
        return "text-green-600 bg-green-50";
      case "Subscriber":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span></span>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="cursor-pointer">
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <UserFormDialog onAddUser={onAddUser} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="role-filter" className="text-sm font-medium">
            Role
          </Label>
          <Select onValueChange={(value) => handleFilterChange("role", value)}>
            <SelectTrigger className="cursor-pointer w-full" id="role-filter">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Author">Author</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
              <SelectItem value="Maintainer">Maintainer</SelectItem>
              <SelectItem value="Subscriber">Subscriber</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-filter" className="text-sm font-medium">
            Plan
          </Label>
          <Select onValueChange={(value) => handleFilterChange("plan", value)}>
            <SelectTrigger className="cursor-pointer w-full" id="plan-filter">
              <SelectValue placeholder="Select Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </Label>
          <Select
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-medium">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getRoleColor(user.role)}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{user.plan}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.billing}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(user.status)}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">View user</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => onEditUser(user)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit user</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                          >
                            <EllipsisVertical className="size-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => onDeleteUser(user.id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size" className="text-sm font-medium">
            Show
          </Label>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-20 cursor-pointer" id="page-size">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="hidden sm:flex items-center space-x-2">
            <p className="text-sm font-medium">Page</p>
            <strong className="text-sm">
              {currentPage} of {totalPages}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
