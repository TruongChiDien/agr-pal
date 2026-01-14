"use client";

import { useState } from "react";
import { PageContainer, ContentSection } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CurrencyInput,
  QuantityInput,
  DatePicker,
  FormField,
  MultiSelectCheckbox,
} from "@/components/forms";

export default function FormsPage() {
  // Currency input state
  const [price, setPrice] = useState(1000000);

  // Quantity input state
  const [quantity, setQuantity] = useState(5);

  // Date picker state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Multi-select state
  const sampleBookings = [
    { id: "1", name: "Booking #001", amount: 5000000, status: "Pending Bill" },
    { id: "2", name: "Booking #002", amount: 3500000, status: "Pending Bill" },
    { id: "3", name: "Booking #003", amount: 2000000, status: "Added Bill" },
    { id: "4", name: "Booking #004", amount: 4200000, status: "Pending Bill" },
  ];

  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

  // Calculate total for selected bookings
  const selectedTotal = sampleBookings
    .filter((b) => selectedBookings.includes(b.id))
    .reduce((sum, b) => b.amount, 0);

  return (
    <PageContainer>
      <ContentSection
        title="Form Components Demo"
        description="Interactive demonstration of all form components"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Currency Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Currency Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Service Price"
                htmlFor="price"
                description="VND-formatted input with auto-formatting"
                required
              >
                <CurrencyInput
                  id="price"
                  value={price}
                  onChange={setPrice}
                  placeholder="Enter amount"
                  min={0}
                  incrementStep={100000}
                />
              </FormField>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Current value:</span> {price.toLocaleString("vi-VN")} đ
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use arrow keys (↑/↓) to increment by 100,000 đ
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quantity Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Work Quantity"
                htmlFor="quantity"
                description="Numeric input with +/- buttons"
                required
              >
                <QuantityInput
                  id="quantity"
                  value={quantity}
                  onChange={setQuantity}
                  min={0}
                  max={100}
                  step={0.5}
                  unit="công"
                />
              </FormField>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Current quantity:</span> {quantity} công
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Min: 0, Max: 100, Step: 0.5
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Date Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Picker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Booking Date"
                htmlFor="date"
                description="Calendar picker with Vietnamese locale"
                required
              >
                <DatePicker
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  placeholder="Chọn ngày"
                />
              </FormField>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Selected date:</span>{" "}
                  {selectedDate ? selectedDate.toLocaleDateString("vi-VN") : "None"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Select Checkbox */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Multi-Select Checkbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Select Bookings for Billing"
                description="Multi-select with disabled items and running total"
              >
                <MultiSelectCheckbox
                  items={sampleBookings}
                  selectedIds={selectedBookings}
                  onSelectionChange={setSelectedBookings}
                  getItemId={(item) => item.id}
                  isItemDisabled={(item) => item.status === "Added Bill"}
                  disabledMessage="This booking has already been added to a bill"
                  renderItem={(item, isSelected, isDisabled) => (
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.amount.toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.status === "Pending Bill"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  )}
                />
              </FormField>

              {selectedBookings.length > 0 && (
                <div className="p-4 bg-primary/5 border border-primary rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Selected Total:</span>
                    <span className="text-xl font-bold text-primary">
                      {selectedTotal.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedBookings.length} booking(s) selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </PageContainer>
  );
}
