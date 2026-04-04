export function CustomToggle() {
  return (
    <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-gray-900">
      <input className="peer sr-only" id="AcceptConditions" type="checkbox" />
      <span className="absolute inset-y-0 inset-s-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:inset-s-8 peer-checked:w-2 peer-checked:bg-white peer-checked:ring-transparent"></span>
    </label>
  );
}
