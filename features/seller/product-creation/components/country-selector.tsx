import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { countries, getCountryData, TCountryCode } from "countries-list";

export const CountrySelector = ({
	value,
	onChange,
}: {
	value: string;
	onChange: (countryCode: string) => void;
}) => {
	const [openCountrySelect, setOpenCountrySelect] = useState(false);
	const [searchCountry, setSearchCountry] = useState("");
	const [isPendingTransition, startTransition] = useTransition();

	return (
		<FormItem className="w-full">
			<FormLabel>Country of Origin</FormLabel>
			<Popover open={openCountrySelect} onOpenChange={setOpenCountrySelect}>
				<PopoverTrigger asChild>
					<FormControl>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={openCountrySelect}
							className={cn(
								"w-full justify-between",
								!value && "text-muted-foreground",
							)}
						>
							{value
								? getCountryData(value as TCountryCode)?.name
								: "Select country..."}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</FormControl>
				</PopoverTrigger>
				<PopoverContent
					className="w-[--radix-popover-trigger-width] p-0"
					align="start"
				>
					<Command>
						<CommandInput
							placeholder="Search country..."
							value={searchCountry}
							onValueChange={(search) => {
								startTransition(() => setSearchCountry(search));
							}}
						/>
						<CommandList>
							<CommandEmpty>No country found.</CommandEmpty>
							<CommandGroup>
								{Object.keys(countries).map((code) => {
									const country = getCountryData(code as TCountryCode);
									if (
										!searchCountry ||
										country.name
											.toLowerCase()
											.includes(searchCountry.toLowerCase())
									) {
										return (
											<CommandItem
												key={code}
												value={country.name}
												onSelect={() => {
													onChange(code);
													setOpenCountrySelect(false);
													setSearchCountry("");
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														value === code ? "opacity-100" : "opacity-0",
													)}
												/>
												{country.name}
											</CommandItem>
										);
									}
									return null;
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<FormMessage />
		</FormItem>
	);
};
