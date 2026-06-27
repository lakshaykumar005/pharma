-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'anthem',
    "client" TEXT NOT NULL,
    "builder" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "asOf" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "workWeek" TEXT NOT NULL,
    "axisStart" TEXT NOT NULL,
    "axisEnd" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Department" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lead" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "roleCode" TEXT NOT NULL,
    CONSTRAINT "Member_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "Department" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Phase" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "pct" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "baselineStart" TEXT NOT NULL,
    "baselineEnd" TEXT NOT NULL,
    "workDays" INTEGER NOT NULL,
    "pct" INTEGER NOT NULL,
    "depType" TEXT NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "roleCode" TEXT NOT NULL,
    "phaseCode" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "Department" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_phaseCode_fkey" FOREIGN KEY ("phaseCode") REFERENCES "Phase" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "dependsOnId" INTEGER NOT NULL,
    CONSTRAINT "Dependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Dependency_taskId_dependsOnId_key" ON "Dependency"("taskId", "dependsOnId");
