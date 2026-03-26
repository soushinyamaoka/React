import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const tableWidth: number = 300
const matColWidth: number = 200

const useStyles = makeStyles({
  table: {
    Width: tableWidth,
  },
  container: {
    display: "flex",
    overflowY:'scroll',
  },
});

interface Column {
  id: 'material' | 'amount';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: number) => string;
}

const columns: Column[] = [
  { id: 'material', label: '材料', minWidth: matColWidth },
  { id: 'amount', label: '分量', minWidth: tableWidth-matColWidth },
];

function createData(no: number, material: string, amount: string) {
  return { no, material, amount };
}

const rows = [
  createData(1, 'にんじん', '1本'),
  createData(2, 'じゃがいも', '３個'),
  createData(3, 'したけ', '6個'),
  createData(4, '12345678901234567890', '1234567890'),
  createData(5, '鮭', '1尾'),
  createData(6, '鮭', '1尾'),
  createData(7, '鮭', '1尾'),
  createData(8, '鮭', '1尾'),
];

const Material = () => {

  return (
    <TableContainer className={useStyles().container} component={Paper}>
      <Table className={useStyles().table} size="small" stickyHeader aria-label="sticky table">
      <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.no}>
              <TableCell>{row.material}</TableCell>
              <TableCell>{row.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
export default Material;