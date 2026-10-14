"use client";

import { Input } from "@/components/ui/input";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  placeholder?: string;
  id?: string;
}

export function PlaceAutocomplete({
  onPlaceSelect,
  placeholder,
  id,
}: PlaceAutocompleteProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ["geometry", "name", "formatted_address", "address_components"],
      types: ["(cities)"],
    };

    const instance = new places.Autocomplete(inputRef.current, options);
    setAutocomplete(instance);

    return () => {
      if (instance) {
        google.maps.event.clearInstanceListeners(instance);
      }
    };
  }, [places]);

  useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      onPlaceSelect(place);
    });

    return () => listener.remove();
  }, [onPlaceSelect, autocomplete]);

  return (
    <Input
      id={id}
      ref={inputRef}
      placeholder={placeholder}
      // Prevent the Dialog from closing if user hits 'Enter' to select a place
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    />
  );
}