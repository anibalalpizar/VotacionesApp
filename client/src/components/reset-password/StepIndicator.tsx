function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              num === currentStep
                ? "bg-orange-500 text-white scale-110 ring-4 ring-orange-200"
                : num < currentStep
                ? "bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
            }`}
          >
            {num < currentStep ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              num
            )}
          </div>
          {num < 3 && (
            <div
              className={`w-24 h-1 mx-2 rounded-full transition-all ${
                num < currentStep 
                  ? "bg-blue-600" 
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default StepIndicator