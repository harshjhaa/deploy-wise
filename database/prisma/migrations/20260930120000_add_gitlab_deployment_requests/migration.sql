-- CreateTable
CREATE TABLE "GitLabDeploymentRequest" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "deployType" TEXT NOT NULL DEFAULT 'regular',
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "pipelineId" TEXT,
    "pipelineUrl" TEXT,
    "buildJobId" TEXT,
    "buildStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitLabDeploymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitLabDeploymentRequest_pipelineId_key" ON "GitLabDeploymentRequest"("pipelineId");
CREATE INDEX "GitLabDeploymentRequest_reservationId_createdAt_idx" ON "GitLabDeploymentRequest"("reservationId", "createdAt");
CREATE INDEX "GitLabDeploymentRequest_requestedById_createdAt_idx" ON "GitLabDeploymentRequest"("requestedById", "createdAt");

-- AddForeignKey
ALTER TABLE "GitLabDeploymentRequest" ADD CONSTRAINT "GitLabDeploymentRequest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GitLabDeploymentRequest" ADD CONSTRAINT "GitLabDeploymentRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
