"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DesignCheckPage() {
  const [selectValue, setSelectValue] = useState("");
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-3xl mx-auto space-y-16">

        <header>
          <h1 className="font-display text-3xl font-medium text-ink">Plotted Design Reference</h1>
          <p className="brevier text-ink-soft mt-1">
            Component primitives — visual review against design reference.
          </p>
          <div className="mt-3 p-3 bg-marigold border border-marigold/30 rounded minion text-marigold">
            ⚠ <strong>Note:</strong> The paper grain texture was approximated — the{" "}
            <code>/design-reference/</code> HTML file was not found in the repo.
            Once the reference file is added, copy the exact{" "}
            <code>feTurbulence</code> values into <code>app/globals.css</code>.
          </div>
        </header>

        {/* ── Typography ── */}
        <section className="space-y-4">
          <SectionTitle>Typography</SectionTitle>
          <div className="space-y-2">
            <p className="font-display text-3xl font-medium text-ink">Display — Fraunces medium</p>
            <p className="font-display italic text-xl text-ink-soft">Display italic — scientific name</p>
            <p className="primer text-ink">Body — Inter regular</p>
            <p className="brevier text-ink-soft">Small body — ink-soft</p>
            <p
              className="font-sans o-type-label text-ink-soft"
            >
              Label — small caps uppercase
            </p>
          </div>
        </section>

        {/* ── Colour palette ── */}
        <section className="space-y-4">
          <SectionTitle>Colour palette</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {[
              ["paper", "#FAF6EC"],
              ["paper-deep", "#F2ECDB"],
              ["paper-line", "#E3D8BC"],
              ["ink", "#2B2A24"],
              ["ink-soft", "#5B574A"],
              ["marigold", "oklch(65.809% 0.15943 31.855)"],
              ["sand", "#E8DFC8"],
              ["sand-line", "#D9CCAC"],
              ["yellow", "oklch(94.577% 0.10215 110.6)"],
              ["white", "#FFF"],
            ].map(([name, hex]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded border border-sand-line"
                  style={{ backgroundColor: hex }}
                />
                <span className="minion text-ink-soft">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Button ── */}
        <section className="space-y-4">
          <SectionTitle>Button</SectionTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Add plant</Button>
            <Button variant="secondary">Edit</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled>Primary disabled</Button>
            <Button variant="secondary" disabled>Secondary disabled</Button>
            <Button variant="ghost" disabled>Ghost disabled</Button>
          </div>
        </section>

        {/* ── Input ── */}
        <section className="space-y-4">
          <SectionTitle>Input</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
            <Input
              label="Genus"
              placeholder="e.g. Rosa"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Species"
              placeholder="e.g. canina"
              defaultValue=""
            />
            <Input
              label="Common name (error state)"
              placeholder="e.g. Dog rose"
              error="This field is required"
              defaultValue=""
            />
            <Input
              label="Cultivar (disabled)"
              placeholder="e.g. 'Compassion'"
              disabled
            />
          </div>
        </section>

        {/* ── Select ── */}
        <section className="space-y-4">
          <SectionTitle>Select</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
            <Select
              label="Sun exposure"
              options={[
                { value: "full", label: "Full sun" },
                { value: "partial", label: "Partial shade" },
                { value: "full-shade", label: "Full shade" },
              ]}
              value={selectValue}
              onValueChange={setSelectValue}
              placeholder="Select exposure…"
            />
            <Select
              label="Soil type (error)"
              options={[
                { value: "clay", label: "Clay" },
                { value: "loam", label: "Loam" },
                { value: "sandy", label: "Sandy" },
              ]}
              error="Please select a soil type"
            />
          </div>
        </section>

        {/* ── Badge ── */}
        <section className="space-y-4">
          <SectionTitle>Badge</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <span className="o-badge is-full-sun">Full sun</span>
            <span className="o-badge is-partial-shade">Partial shade</span>
            <span className="o-badge is-flowering-spring">Spring</span>
            <span className="o-badge is-flowering-summer">Summer</span>
            <span className="o-badge">Perennial</span>
            <span className="o-badge">Climber</span>
          </div>
        </section>

        {/* ── Card ── */}
        <section className="space-y-4">
          <SectionTitle>Card</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <Card
              title="Dog Rose"
              subtitle="Rosa canina"
              tags={
                <>
                  <span className="o-badge is-full-sun">Full sun</span>
                  <span className="o-badge is-flowering-summer">Summer</span>
                </>
              }
              badge={<span className="o-badge">Active</span>}
              onClick={() => {}}
            />
            <Card
              photoUrl="https://images.unsplash.com/photo-1490750967868-88df5691cc6a?w=400&h=300&fit=crop"
              photoAlt="Rose in bloom"
              title="Climbing Rose"
              subtitle="Rosa 'Compassion'"
              tags={<span className="o-badge is-flowering-spring">Spring</span>}
              footer={
                <span className="minion text-ink-soft">Planted 2022</span>
              }
              onClick={() => {}}
            />
          </div>
        </section>

        {/* ── EmptyState ── */}
        <section className="space-y-4">
          <SectionTitle>Empty state</SectionTitle>
          <div className="border border-sand-line rounded-lg">
            <EmptyState
              illustration={<PlantSvg />}
              heading="No plants yet"
              body="Start building your garden portfolio by adding your first plant."
              action={<Button variant="primary">Add your first plant</Button>}
            />
          </div>
        </section>

      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="o-type-label text-ink-soft border-b border-sand-line pb-2">
      {children}
    </h2>
  );
}

function PlantSvg() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M48 80V40M48 40C48 40 36 30 28 20M48 40C48 40 60 30 68 20M48 40C48 40 40 50 36 60M48 40C48 40 56 50 60 60"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
