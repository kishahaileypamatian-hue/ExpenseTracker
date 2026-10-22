import { ref } from 'vue'

const dataVersion = ref(0)

export function useDataRefresh() {
  function markDataChanged() {
    dataVersion.value += 1
  }

  return {
    dataVersion,
    markDataChanged,
  }
}