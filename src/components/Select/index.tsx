import { useState } from 'react'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { SortType } from '../../types'

export type MenuItemType = {
  label: string
  value: SortType
}
interface ISelectProps {
  itemList: MenuItemType[]
  selectedItem: SortType
  setSelectedItem: (index: SortType) => void
}
export const Select: React.FC<ISelectProps> = ({
  itemList,
  selectedItem,
  setSelectedItem
}) => {
  const [isOpendDropdown, setIsOpenedDropdown] = useState(false)
  const selItem = itemList.find((item) => item.value == selectedItem)
  return (
    <div className={`relative flex items-center bg-transparent`}>
      <button
        className={`flex items-center py-2 cursor-pointer`}
        onClick={() => setIsOpenedDropdown(true)}
      >
        <div className={`text-[10px] font-medium`}>{selItem ? selItem.label : ''}</div>
        <div className="w-5 ml-1">
          <ChevronDownIcon fontWeight={800} />
        </div>
      </button>

      {isOpendDropdown && (
        <>
          <div className="inset-0 fixed top-0 left-0 w-full h-full z-0" onClick={() => setIsOpenedDropdown(false)} />
          <div className="absolute w-max top-7 left-0 bg-black py-2 rounded-[0.5vw] z-50">
            {itemList.map((item) => {
              return (
                <div
                  className={`flex items-center cursor-pointer px-4 py-1.5 ${selItem && selItem.value === item.value ? 'bg-black/8 text-opacity-80' : 'hover:bg-[#292D3C]'}`}
                  onClick={() => {
                    setIsOpenedDropdown(false)
                    setSelectedItem(item.value)
                  }}
                  key={`${item.value}-${item.label}`}
                >
                  {item.label}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default Select