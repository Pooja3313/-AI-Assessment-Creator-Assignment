"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssignmentCard } from "@/components/AssignmentCard";
import { useToast } from "@/components/ui/use-toast";
import type { Assignment } from "@vedaai/types";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => { fetchAssignments(); }, []);

  async function fetchAssignments() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/assignments`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAssignments(data.assignments || data || []);
    } catch { setAssignments([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let r = assignments;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      r = r.filter(a => a.metadata.topic.toLowerCase().includes(t) || a.metadata.subject.toLowerCase().includes(t));
    }
    if (filterStatus !== "all") r = r.filter(a => a.status === filterStatus);
    if (filterSubject !== "all") r = r.filter(a => a.metadata.subject === filterSubject);
    setFilteredAssignments(r);
  }, [assignments, searchTerm, filterStatus, filterSubject]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setAssignments(prev => prev.filter(a => a._id !== id));
      toast({ title: "Deleted", description: "Assignment permanently deleted.", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  }

  const uniqueSubjects = Array.from(new Set(assignments.map(a => a.metadata.subject))).sort();

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-shrink-0 px-4 pt-6 lg:px-10 lg:pt-8 max-w-7xl mx-auto w-full">
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Assignments</h1>
              <p className="text-gray-500">Manage and create AI-powered question papers.</p>
            </div>
            {assignments.length > 0 && (
              <Button asChild className="gap-2 self-start sm:self-auto flex-shrink-0">
                <Link href="/assignments/create"><Plus className="h-4 w-4" /> New Assignment</Link>
              </Button>
            )}
          </div>
        </div>

        {!loading && assignments.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center animate-float">
                <Plus className="h-10 w-10 text-gray-900" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Assignments Yet</h2>
              <p className="text-gray-500 mb-8">Create your first AI-powered question paper to get started.</p>
              <Button asChild><Link href="/assignments/create"><Plus className="h-4 w-4 mr-2" /> Create Assignment</Link></Button>
            </div>
          </div>
        )}
      </div>

      {assignments.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 lg:px-10 max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          <div className="sticky top-0 z-10 bg-gray-50 pt-2 pb-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Input type="text" placeholder="Search Assignment" className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-40 border-gray-200 rounded-xl">
                      <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Filter By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Ready</SelectItem>
                      <SelectItem value="processing">Generating</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  {uniqueSubjects.length > 0 && (
                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                      <SelectTrigger className="w-full sm:w-40 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Filter By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {(searchTerm || filterStatus !== "all" || filterSubject !== "all") && (
                <div className="mt-3 text-sm text-gray-500">Showing {filteredAssignments.length} of {assignments.length}</div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" style={{animationDelay:`${i*0.1}s`}} />)}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No assignments match your filters.</p>
                <Button variant="outline" className="rounded-full" onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterSubject("all"); }}>Clear Filters</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {filteredAssignments.map((a, i) => (
                <div key={a._id} className="animate-stagger" style={{animationDelay:`${i*0.08}s`, animationFillMode:"both"}}>
                  <AssignmentCard assignment={a} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {assignments.length > 0 && (
        <Link href="/assignments/create" className="fixed bottom-20 right-6 z-50 lg:hidden h-14 w-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:rotate-12">
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}