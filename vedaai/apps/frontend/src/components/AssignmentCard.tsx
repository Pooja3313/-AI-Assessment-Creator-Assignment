"use client";

import { FileText, MoreVertical, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Assignment } from "@vedaai/types";

export function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete: (id: string) => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A";
  const statusClr = (s: string) => s === "completed" ? "bg-green-50 text-green-700 border-green-200" : s === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" : s === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-700 border-gray-200";
  const statusLbl = (s: string) => s === "completed" ? "Ready" : s === "processing" ? "Generating" : s === "pending" ? "Pending" : s;

  const handleDelete = async () => {
    setIsDeleting(true);
    try { await onDelete(assignment._id); setShowDeleteDialog(false); }
    finally { setIsDeleting(false); }
  };

  return (
    <>
      <Card className="hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden rounded-xl bg-white group hover:-translate-y-0.5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-6 w-6 text-gray-900" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${statusClr(assignment.status)}`}>{statusLbl(assignment.status)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white shadow-lg rounded-xl border border-gray-200 p-1.5">
                  <DropdownMenuItem asChild>
                    <Link href={`/result/${assignment._id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-gray-700 hover:bg-gray-100 transition-all">
                      <Eye className="h-4 w-4" />
                      <span>View Assignment</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-red-600 hover:bg-red-50 transition-all">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <h3 className="font-bold text-base text-gray-900 mb-3 line-clamp-1">{assignment.metadata.topic}</h3>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-between"><span className="font-medium text-xs">Assigned on : {formatDate(assignment.createdAt)}</span></div>
            <div className="flex items-center justify-between"><span className="font-medium text-xs">Due : {formatDate(assignment.metadata.dueDate)}</span></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3 mt-3">
            <span className="font-semibold">{assignment.metadata.totalQuestions} questions</span>
            <span className="font-semibold">{assignment.metadata.totalMarks} marks</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl text-gray-900">Delete Assignment?</DialogTitle>
            <DialogDescription className="text-gray-500">This will permanently delete &ldquo;{assignment.metadata.topic}&rdquo;. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting} className="rounded-full">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-full bg-red-600 hover:bg-red-700 text-white">{isDeleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}