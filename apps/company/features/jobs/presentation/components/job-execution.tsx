import { Icon } from "@/app/components/app-icon";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDateTime, formatEuro } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { executionRules, type Handover, type HandoverMoment, type JobExecution, type Photo } from "../../domain/execution";
import type { JobsText } from "../job-summary-text";
import { DeleteRecord, HandoverForm, IncidentForm, PhotoForm, ResolveForm, type JobRef, type Now } from "./execution-forms";

type Props = {
  job: JobRef;
  status: "scheduled" | "in-progress" | "delivered" | "closed";
  execution: JobExecution;
  now: Now;
  /** Nombre del cliente, propuesto como quien firma el acta. */
  client: string;
  t: JobsText;
};

const card = "flex flex-col gap-3.5 rounded-3xl border border-line bg-surface p-5.5";
const heading = "text-base font-bold";
const link = "text-[13px] font-bold text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function Photos({ photos, job, t, canDelete }: { photos: Photo[]; job: JobRef; t: JobsText["execution"]; canDelete: boolean }) {
  if (photos.length === 0) return null;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
      {photos.map((photo) => (
        <li key={photo.id} className="flex flex-col gap-1">
          {photo.url ? (
            <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-line-soft">
              {/* Enlace firmado y temporal de Storage: next/image no aporta nada aquí */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={interpolate(t.photoAlt, { when: formatDateTime(photo.takenAt) })} className="aspect-square w-full object-cover" />
            </a>
          ) : (
            <span className="grid aspect-square place-items-center rounded-xl bg-surface-soft text-xs text-muted">{t.photoUnavailable}</span>
          )}
          <span className="text-xs text-muted">{formatDateTime(photo.takenAt)}</span>
          {canDelete && photo.source === "panel" ? <DeleteRecord job={job} kind="evidence" id={photo.id} t={t} label={t.delete} /> : null}
        </li>
      ))}
    </ul>
  );
}

function HandoverSummary({ handover, t }: { handover: Handover; t: JobsText["execution"] }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-success-surface px-3.5 py-3 text-[13px] text-success-foreground">
      <strong className="text-sm">{interpolate(t.signedBy, { name: handover.signerName, when: formatDateTime(handover.signedAt) })}</strong>
      {handover.remarks ? <span className="text-foreground">{handover.remarks}</span> : null}
      <span className="flex flex-wrap gap-3">
        {handover.documentUrl ? (
          <a href={handover.documentUrl} target="_blank" rel="noopener noreferrer" className={link}>
            {t.viewDocument}
          </a>
        ) : (
          <span className="text-muted">{t.noDocument}</span>
        )}
      </span>
    </div>
  );
}

/** Recogida, entrega e incidencias del trabajo (paso 6.5, RF-51 a RF-53, RF-55). */
export function JobExecutionSection({ job, status, execution, now, client, t }: Props) {
  const e = t.execution;
  const rules = executionRules(status);
  const openIncidents = execution.incidents.filter((incident) => incident.status === "open").length;

  const moment = (kind: HandoverMoment) => {
    const handover = kind === "pickup" ? execution.pickup : execution.delivery;
    const canRecord = kind === "pickup" ? rules.recordPickup : rules.recordDelivery;
    const canDelete = kind === "pickup" ? rules.deletePickup(execution.incidents.length) : rules.deleteDelivery;
    const photos = execution.photos.filter((photo) => photo.moment === kind);
    const title = kind === "pickup" ? e.pickupTitle : e.deliveryTitle;

    return (
      <section aria-labelledby={`execution-${kind}`} className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={`execution-${kind}`} className={heading}>
            {title}
          </h2>
          <a href={localePath(job.lang, ROUTES.jobs.print(job.orderId, kind))} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 ${link}`}>
            <Icon name="filePlus" size={14} strokeWidth={2.2} />
            {e.printDocument}
          </a>
        </div>

        {handover ? (
          <>
            <HandoverSummary handover={handover} t={e} />
            {canDelete && handover.source === "panel" ? <DeleteRecord job={job} kind="handover" id={handover.id} t={e} label={e.deleteHandover} /> : null}
          </>
        ) : canRecord ? (
          <HandoverForm key={`${kind}-form`} job={job} moment={kind} now={now} t={e} defaultSigner={client} />
        ) : (
          <p className="rounded-[14px] bg-surface-soft p-3.5 text-[13px] text-muted">{kind === "pickup" ? e.pickupPending : e.deliveryPending}</p>
        )}

        <Photos photos={photos} job={job} t={e} canDelete={rules.deleteRecords} />
        {rules.addPhotos ? <PhotoForm key={`${kind}-${photos.length}`} job={job} moment={kind} now={now} t={e} /> : null}
      </section>
    );
  };

  return (
    <>
      {moment("pickup")}

      <section aria-labelledby="execution-incidents" className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="execution-incidents" className={heading}>
            {e.incidentsTitle}
          </h2>
          {openIncidents > 0 ? <span className="text-[13px] font-bold text-warn-foreground">{interpolate(e.openCount, { count: openIncidents })}</span> : null}
        </div>
        {execution.incidents.length === 0 ? <p className="text-[13px] text-muted">{e.noIncidents}</p> : null}
        <ul className="flex flex-col gap-3">
          {execution.incidents.map((incident) => (
            <li key={incident.id} className={`flex flex-col gap-2.5 rounded-2xl p-3.5 ${incident.status === "open" ? "border-2 border-warn-border bg-warn-surface" : "border border-line"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <strong className="text-sm">{e.incidentTypes[incident.type]}</strong>
                <span className="text-[13px] font-bold">{incident.extraAmountCents > 0 ? formatEuro(incident.extraAmountCents) : e.noAmount}</span>
              </div>
              <p className="text-[13px]">{incident.description}</p>
              <span className="text-xs text-muted">{formatDateTime(incident.occurredAt)}</span>
              {incident.status === "resolved" ? (
                <p className="rounded-xl bg-success-surface px-3 py-2 text-[13px] text-success-foreground">
                  {interpolate(e.resolvedOn, { when: formatDateTime(incident.resolvedAt ?? incident.occurredAt), note: incident.resolutionNote ?? "" })}
                </p>
              ) : rules.deleteRecords ? (
                <ResolveForm job={job} incidentId={incident.id} t={e} />
              ) : null}
              <Photos photos={incident.photos} job={job} t={e} canDelete={rules.deleteRecords} />
              {rules.addPhotos ? <PhotoForm key={`incident-${incident.id}-${incident.photos.length}`} job={job} moment="incident" incidentId={incident.id} now={now} t={e} /> : null}
              {rules.deleteRecords && incident.source === "panel" ? <DeleteRecord job={job} kind="incident" id={incident.id} t={e} label={e.deleteIncident} /> : null}
            </li>
          ))}
        </ul>
        {rules.reportIncident ? (
          <IncidentForm key={`incident-form-${execution.incidents.length}`} job={job} now={now} t={e} />
        ) : status === "scheduled" ? (
          <p className="text-xs text-muted">{e.incidentsAfterPickup}</p>
        ) : null}
      </section>

      {moment("delivery")}
    </>
  );
}
